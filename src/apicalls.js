
export const getStates = () => {
  return fetch(`https://cdn-api.co-vin.in/api/v2/admin/location/states`,{
    method:"GET",
    headers:{
      Accept:"application/json",
      "Content-Type":"application/json"
    }
  }).then(response => {
    return response.json()
  }).catch(err => console.log(err))
}

export const getDistricts = (stateId) => {
  return fetch(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${stateId}`,{
    method:"GET",
    headers:{
      Accept:"application/json",
      "Content-Type":"application/json"
    }
  }).then(response => {
    return response.json()
  }).catch(err => console.log(err))
}

export const getCenter = (districtId,date) => {
  return fetch(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${date}`,{
    method:"GET",
    headers:{
      Accept:"application/json",
      "Content-Type":"application/json"
    }
  }).then(response => {
    return response.json()
  }).catch(err => console.log(err))
}