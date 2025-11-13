'use client'
import Image from "next/image";
import FullStepForm from "./components/input-form/FullInputForm"
import { FormContextProvider } from "./context/FormContext"
const Home = () => {
  return (
    <div>
      {/* Header for main form only */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="NAC Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <h1 className="ml-3 text-xl font-semibold text-[#003594] dark:text-white">
                Overtime Calculator
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormContextProvider>
          <FullStepForm />
        </FormContextProvider>
      </main>
    </div>
  )
}

export default Home