'use client'
import FullStepForm from "./components/input-form/FullInputForm"
import { FormContextProvider } from "./context/FormContext"
const Home = ()=>{
  return (
    <>
    <FormContextProvider>
      <FullStepForm/>
    </FormContextProvider>
    </>
  )
}

export default Home