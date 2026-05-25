import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useRedux'
import CheckoutStepper from '../../components/checkout/CheckoutStepper'

const ModernCartPage = () => {
  const navigate = useNavigate()
  const items = useAppSelector((state) => state.checkoutCart.items)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <CheckoutStepper activeStep={0} />
      <Typography variant="h4" fontWeight={700} mb={2}>
        Cart
      </Typography>
      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.productId} variant="outlined">
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography fontWeight={600}>{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Qty: {item.quantity}
                </Typography>
              </Box>
              <Typography fontWeight={700}>Rs. {item.price * item.quantity}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Total: Rs. {total}</Typography>
        <Button variant="contained" onClick={() => navigate('/modern/checkout')} disabled={!items.length}>
          Proceed to Checkout
        </Button>
      </Box>
    </Container>
  )
}

export default ModernCartPage

