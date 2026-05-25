import { Button, Card, CardContent, Container, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import CheckoutStepper from '../../components/checkout/CheckoutStepper'

const ModernOrderSuccessPage = () => {
  const { state } = useLocation()
  const orderId = state?.orderId || 'N/A'

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <CheckoutStepper activeStep={3} />
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} mb={1}>
            Order Successful
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Your order has been placed successfully.
          </Typography>
          <Typography variant="body1" mb={3}>
            Order ID: <strong>{orderId}</strong>
          </Typography>
          <Button component={Link} to="/modern/cart" variant="contained">
            Back to Cart
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}

export default ModernOrderSuccessPage

