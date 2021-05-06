import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container';
import useSound from 'use-sound'
import beep from './sounds/beep.wav'
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
  let  intervalId
  const [states, setStates] = useState([])
  const [centers, setCenters] = useState([])
  const [districts, setDistricts] = useState([])
  const [alertNames, setAlertNames] = useState("")

  const [result, setResult] = useState(true)
  const [found, setFound] = useState(false)



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
    if(intervalId){
      clearInterval(intervalId)
    }
    if(found){
      setFound(false)
    }
    if(!result){
      setResult(true)
    }
    setRequest({...request,lastRun:moment().format("DD-MM-YY, h:mm:ss a")})
      getCenter(districtId,date).then(data=> {
        if(data.error){
          setError("Unable to fetch Centers")
        }else{
          setCenters(data.centers)
          console.log(centers)
          setError("")
        }
      }).catch(setError("Unable to fetch Centers"))

    intervalId = setInterval(function() {
      //  I will run for every 15 minutes
      setRequest({...request,lastRun:moment().format("DD-MM-YY, h:mm:ss a")})
      getCenter(districtId,date).then(data=> {
        if(data.error){
          setError("Unable to fetch Centers")
        }else{
          setCenters(data.centers)
          console.log(centers)
          setError("")
        }
      }).catch(setError("Unable to fetch Centers"))
     }, 5 * 60 * 1000);
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

  useEffect(() => {
    fillStateData()
  }, [])

  useEffect(() => {
   errorMessage()
  }, [])

  useEffect(() => {
    if(found)
    {play()}
  }, [found])

  const paramForm = () => {
    return(
    <Form className="rounded border border-warning p-2 bg-white">
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
      <p>Enter name of centers for which you want notification alram.If there are multiple centers separate them using a comma(,)</p>
          <div class="input-group rounded mb-1">
            <input type="search" class="form-control rounded" placeholder="ex: Nesco, nanavati" aria-label="Search" aria-describedby="search-addon" onChange={handleChange("alert")}/>
          </div>
      <Button block size="lg" variant="success" onClick={() => getCenterData(districtId,date)}>Start</Button>
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
  const filterCenters = () => {
    return(
      centers.map((center,i) => (
        center.sessions.map((session,j) => (
          session.available_capacity > 0 ? centerDisplay(center,session,i+j): ""
        ))
      ))
    )
  }

  const centerDisplay = (Center,session,index) => {
    if(result){
      setResult(false)
    }
    if(alertNames.length > 0 && !found){
      alertNames.split(",").forEach(name =>{
        if(Center.name.toLowerCase().includes(name)){
            setFound(true)
        }
      })
    }
    return(
      <div key={index} className="border border-warning bg-warning rounded p-1 m-1">
        <div className="row">
          <div className="col-7">
          <h5 className="text-light">{Center.name}</h5>
          </div>
          <div className={session.vaccine === "COVAXIN"?"col-2 bg-primary text-white text-center rounded":"col-2 bg-danger text-white rounded text-center"}>
          {session.vaccine}
          </div>
          <div className="col-2 offset-1 text-center rounded bg-white">
          {session.min_age_limit}+yrs
          </div>
        </div>         
        <p>Address: {Center.address}</p>
        <div className="row m-1">
          <div className="col-6 offset-3 text-center border border-success rounded bg-white">
          Available: {session.available_capacity} doses
          </div>
          <div className="col-3">
            {session.date}
            </div>              
        </div>
      </div>
      )
  }

  return (
    <div>
      <div className="m-1 mb-2 p-1 border border-danger rounded bg-warning">
      <h3 className="text-light text-center">Covid 19 Vaccine Availability Checker - India</h3> 
      </div>
      <Container className="bg-white pt-2 rounded">
      <div className="row">
        <div className="col-5">
          <p>This tracker will check the vaccine availability every 30 mins for the entire week. Simply select your state and district similar to CoWin platform and click start!</p>
          {paramForm()}
          {errorMessage()}
        </div>
          <div className="col-7 result">            
          {filterCenters()}
          {result &&(
            <div className="alert alert-danger">
              No appointments Available
            </div>
          )}
          </div>
      </div>         
    </Container>
    </div>
  );
}

export default App;
