import { Step, StepLabel, Stepper } from '@mui/material'

const steps = ['Cart', 'Address', 'Payment', 'Review']

const CheckoutStepper = ({ activeStep = 0 }) => {
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  )
}

export default CheckoutStepper

