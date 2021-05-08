import Form from 'react-bootstrap/Form'
import { IoLogoLinkedin,IoAddCircle} from "react-icons/io5";
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container';
import useSound from 'use-sound'
import beep from './sounds/alarm.mp3'
import './App.css';
import { useEffect, useState } from 'react';
import { getDistricts, getStates, getCenter } from './apicalls';
import moment from 'moment'

function App() {
  const [request, setRequest] = useState({
    districtId:"",
    date:moment().format("DD-MM-YY"),
    lastRun:""
  })

  const [play] = useSound(beep);

  const {districtId,date,lastRun} = request
  const [intervalId, setIntervalId] = useState()

  const [states, setStates] = useState([])
  const [centers, setCenters] = useState([])
  const [districts, setDistricts] = useState([])
  const [centers45, setCenters45] = useState([])
  const [centers18, setCenters18] = useState([])

  const [alertNames, setAlertNames] = useState("")

  const [error, setError] = useState("")

  const fillStateData = () => {
    getStates().then(
      data => {
        if(data.error){
          setError("Unable to fetch states")
        }else{
          setStates(data.states)
          setError("")
        }
      }
    ).catch(setError("Unable to fetch states"))
  }

  const fillDistrictData = (stateId) => {
    getDistricts(stateId).then(data=> {
      if(data.error){
        setError("Unable to fetch Districts")
      }else{
        setDistricts(data.districts)
        setError("")

      }
    }).catch(setError("Unable to fetch Districts"))
  }

  const getCenterData = (districtId, date) => {
    console.log("Selected district:",districtId)
    if(intervalId){
      clearInterval(intervalId)
    }
    setRequest({...request,lastRun:moment().format("DD-MM-YY, h:mm:ss a")})
      getCenter(districtId,date).then(data=> {
        if(data & data.error){
          setError("Unable to fetch Centers")
        }else{
          setCenters(data.centers)
          filterCenters()
          setError("")
        }
      }).catch(setError("Unable to fetch Centers"))

      setIntervalId(setInterval(function() {
        console.log("Selected district:",districtId)
        setCenters([])
          //  I will run for every 5 minutes
          setRequest({...request,lastRun:moment().format("DD-MM-YY, h:mm:ss a")})
          getCenter(districtId,date).then(data=> {
            if(data & data.error){
              setError("Unable to fetch Centers")
            }else{
              setCenters(data.centers)
              filterCenters()
              setError("")
            }
          }).catch(setError("Unable to fetch Centers"))
         }, 1 * 60 * 1000))
  }

  const handleChange = name => event => {
    if(name === "stateId"){
      fillDistrictData(event.target.value)
    }
    if(name === "districtId"){
      setRequest({...request,[name]:event.target.value})
    }
    if(name === "alert"){
      setAlertNames(event.target.value)
    }
  }

  const paramForm = () => {
    return(
    <Form className="rounded border border-warning p-2 bg-white m-1">
      <div className="row">
        <div className="col-md-6">
          <Form.Group controlId="exampleForm.SelectCustomSizeLg">
          <Form.Label>Select State</Form.Label>
          <Form.Control as="select" size="lg" custom onChange={handleChange("stateId")}>
            {states.map((state,index) =>{return(
              <option key={index} value={state.state_id}>{state.state_name}</option>
            )})}              
          </Form.Control>
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group controlId="exampleForm.SelectCustomSizeLg">
          <Form.Label>Select District</Form.Label>
          <Form.Control as="select" size="lg" custom onChange={handleChange("districtId")}>
          {districts.map((district,index) =>{return(
              <option key={index} value={district.district_id}>{district.district_name}</option>
            )})}
          </Form.Control>
          </Form.Group>
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <p>Start Date: <b>{date}</b></p>
        </div>
        <div className="col-6">
          <p>Last Checked: <b>{lastRun}</b></p>
        </div>
      </div>
      <p>Enter name of centers for which you want notification sound alarm.</p>
          <div className="input-group rounded">
            <input type="search" className="form-control rounded" placeholder="ex: Nesco, nanavati" aria-label="Search" aria-describedby="search-addon" onChange={handleChange("alert")}/>
          </div>
      <p>If there are multiple centers separate them using a comma(,).If your preffered center is availale an alarm will ring! <u>Note:You have to leave the tab open for alaram to ring</u></p>
      <div className="row">
      <div className="col-5 text-center">
        <a href = "https://www.cowin.gov.in/home" target="_blank"className="btn btn-outline-danger"><IoAddCircle/> Go to Cowin</a>
      </div>
      <div className="col-7 text-center">
      <Button block size="md" variant="success" onClick={() => getCenterData(districtId,date)}>Start</Button>
      </div>
      </div>
    </Form>
    )
  }

  const errorMessage = () => {
    return(
      <div
      className="alert alert-danger"
      style={{ display: error ? "" : "none" }}
    >
      {error}
    </div>
    )
  }

  let centersFor45 = []
  let centersFor18 = []

  const filterCenters = () => {
    console.log("start filtering...")
    centersFor18 = [];
    centersFor45 = [];
    var i = 0
    var j = 0
      for(i=0 ; i < centers.length ; i++){        
        for(j=0 ; j < centers[i].sessions.length ; j++){          
          if(centers[i].sessions[j].available_capacity > 1 && centers[i].sessions[j].min_age_limit === 45){
            centersFor45.push({name:centers[i].name,address:centers[i].address, sessions:centers[i].sessions[j], pincode: centers[i].pincode})
          }
          if(centers[i].sessions[j].available_capacity > 1 && centers[i].sessions[j].min_age_limit === 18){
            centersFor18.push({name:centers[i].name,address:centers[i].address, sessions:centers[i].sessions[j], pincode: centers[i].pincode})
          }            
        }        
      } 

      setCenters18(centersFor18)
      setCenters45(centersFor45)
      console.log("found 18+ centers:",centersFor18.length)
      console.log("found 45+ centers:",centersFor45.length)
      console.log("alert names length",alertNames.length)
      if(alertNames.length > 0){
        alertNames.split(",").forEach(name =>{
          if(centers18.some( center => center.name.toLowerCase().includes(name.toLowerCase()))){
           
            play()
          };
          if(centers45.some( center => center.name.toLowerCase().includes(name.toLowerCase()))){            
            play()
          };
        })
      }
      console.log("filtering done!")             
  }

  const centerDisplay = (center,index) => {
    return(
      <div key={index} className="border border-warning bg-warning rounded p-1 m-1">
          <div className="row">
            <div className="col-lg-7 col-sm-12">
            <h5 className="text-light">{center.name}</h5>
            </div>
            <div className={center.sessions.vaccine === "COVAXIN"?"col-lg-3 col-10 bg-primary text-white text-center rounded":"col-lg-3 col-10 offset-1 bg-danger text-white rounded text-center"}>
            {center.sessions.vaccine}
            </div>
          </div>         
          <p>Address: {center.address} <br/> Pincode: {center.pincode}</p>
          <div className="row m-1">
            <div className="col-lg-6 col-sm-8 text-center border border-success rounded bg-white">
            Available: {center.sessions.available_capacity} doses
            </div>
            <div className="col-lg-6 col-sm-4 text-center">
              {center.sessions.date}
              </div>              
          </div>
        </div>     
    )

  }

  useEffect(() => {
    fillStateData()
  }, [])

  useEffect(() => {
   errorMessage()
  }, [error,errorMessage])


  return (
    <div>
      <div className="m-1 mb-2 p-1 border border-danger rounded bg-warning">
      <h3 className="text-light text-center">Covid 19 Vaccine Availability Checker - India</h3> 
    </div>
    <Container className="bg-white pt-2 rounded">
      <div className="row">
        <div className="col-lg-5 col-sm-12">
          <p>This tracker will check the vaccine availability every 5 mins for the entire week. Simply select your state and district similar to CoWin platform and click start!</p>
          {paramForm()}          
          {errorMessage()}
        </div>
          <div className="col-lg-7 col-sm-12">
            <h5 className="text-center bg-info text-light p-1 rounded">45+ Years</h5>
            {(centers45.length === 0) &&(
            <div className="alert alert-danger">
              No appointments Available
            </div>
            )} 
            {(centers45.length > 0) && (<div className="result"> 
            { centers45.map((center,index) => {return(
              centerDisplay(center,index)            
            )})}
            </div> )}            
            <h5 className="text-center bg-info text-light p-1 rounded mt-2">18-45 Years</h5>  
            {(centers18.length === 0) &&(
            <div className="alert alert-danger">
              No appointments Available
            </div>
          )}
          {(centers18.length > 0) && (<div className="result">                   
          { centers18.map((center,index) => {return(
          centerDisplay(center,index)            
        )})}
            </div>  )}                              
          </div>
      </div>         
    </Container>
    <footer className="col-12 bg-warning pt-1 text-center mt-2">
      <div className="row">
      <div className="col-lg-12 col-sm-12 text-center">
        <p>Created by: Aditya Singhania <a href="http://www.linkedin.com/in/aditya-singhania-604681119" target="_blank"><IoLogoLinkedin color="#0e76a8" size="45"/></a></p>                
      </div>
      </div>      
    </footer>
    </div>
  );
}

export default App;
