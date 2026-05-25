import { useEffect, useMemo, useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import CheckoutStepper from '../../components/checkout/CheckoutStepper'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { loginUser, registerUser } from '../../redux/authSlice'
import {
  clearOrderError,
  createGuestOrder,
  createUserOrder,
  fetchSavedAddresses,
  setSelectedAddress,
} from '../../redux/orderSlice'

const schema = yup.object({
  fullName: yup.string().required('Full Name is required'),
  email: yup.string().email('Enter valid email').required('Email is required'),
  phone: yup.string().matches(/^\d{10}$/, 'Enter valid 10 digit phone').required('Phone is required'),
  addressLine1: yup.string().required('Address Line 1 is required'),
  addressLine2: yup.string().optional(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pincode: yup.string().matches(/^\d{6}$/, 'Enter valid 6 digit pincode').required('Pincode is required'),
  country: yup.string().required('Country is required'),
})

const defaultValues = {
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
}

const ModernCheckoutPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, loading: authLoading, error: authError } = useAppSelector((state) => state.auth)
  const { items } = useAppSelector((state) => state.checkoutCart)
  const { savedAddresses, selectedAddressId, loading: orderLoading, error: orderError } = useAppSelector(
    (state) => state.order
  )
  const [guestMode, setGuestMode] = useState(false)
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
  const [authTab, setAuthTab] = useState('login')

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  })

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  useEffect(() => {
    if (user) dispatch(fetchSavedAddresses())
  }, [dispatch, user])

  const onGuestOrder = async (values) => {
    dispatch(clearOrderError())
    const payload = {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      shippingAddress: {
        fullName: values.fullName,
        mobile: values.phone,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        country: values.country,
      },
      paymentMethod: 'COD',
    }
    const action = await dispatch(createGuestOrder(payload))
    if (!action.error) {
      navigate('/modern/order-success', { state: { orderId: action.payload?.id || action.payload?._id } })
    }
  }

  const onUserOrder = async () => {
    dispatch(clearOrderError())
    const selectedAddress = savedAddresses.find((a) => String(a._id || a.id) === String(selectedAddressId))
    if (!selectedAddress) return
    const payload = {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      shippingAddress: selectedAddress,
      paymentMethod: 'COD',
    }
    const action = await dispatch(createUserOrder(payload))
    if (!action.error) {
      navigate('/modern/order-success', { state: { orderId: action.payload?.id || action.payload?._id } })
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    const action =
      authTab === 'login'
        ? await dispatch(loginUser({ email: authForm.email, password: authForm.password }))
        : await dispatch(registerUser({ name: authForm.name, email: authForm.email, password: authForm.password }))
    if (!action.error) dispatch(fetchSavedAddresses())
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CheckoutStepper activeStep={1} />
      <Typography variant="h4" fontWeight={700} mb={3}>
        Checkout
      </Typography>
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: '1.2fr 1fr' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Address
            </Typography>
            {!user && (
              <Button
                variant={guestMode ? 'contained' : 'outlined'}
                onClick={() => setGuestMode(true)}
                sx={{ mb: 2 }}
              >
                Continue as Guest
              </Button>
            )}
            {guestMode && !user && (
              <Box component="form" onSubmit={handleSubmit(onGuestOrder)}>
                <Stack spacing={2}>
                  {Object.keys(defaultValues).map((field) => (
                    <Controller
                      key={field}
                      name={field}
                      control={control}
                      render={({ field: formField }) => (
                        <TextField
                          {...formField}
                          label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          error={Boolean(errors[field])}
                          helperText={errors[field]?.message}
                        />
                      )}
                    />
                  ))}
                  {orderError && <Alert severity="error">{orderError}</Alert>}
                  <Button type="submit" variant="contained" disabled={orderLoading}>
                    {orderLoading ? <CircularProgress size={22} /> : 'Place Guest Order'}
                  </Button>
                </Stack>
              </Box>
            )}
            {user && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Select saved address or add a new one.
                </Typography>
                <RadioGroup
                  value={selectedAddressId}
                  onChange={(e) => dispatch(setSelectedAddress(e.target.value))}
                >
                  {savedAddresses.map((address) => {
                    const id = address._id || address.id
                    return (
                      <FormControlLabel
                        key={id}
                        value={id}
                        control={<Radio />}
                        label={`${address.fullName}, ${address.addressLine1}, ${address.city}`}
                      />
                    )
                  })}
                </RadioGroup>
                {orderError && <Alert severity="error">{orderError}</Alert>}
                <Button variant="contained" onClick={onUserOrder} disabled={orderLoading || !selectedAddressId}>
                  {orderLoading ? <CircularProgress size={22} /> : 'Place Order'}
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              {user ? `Welcome, ${user?.name || 'User'}` : 'Login / Register'}
            </Typography>
            {!user ? (
              <Box component="form" onSubmit={handleAuthSubmit}>
                <Stack spacing={2}>
                  <Box display="flex" gap={1}>
                    <Button
                      variant={authTab === 'login' ? 'contained' : 'outlined'}
                      onClick={() => setAuthTab('login')}
                    >
                      Login
                    </Button>
                    <Button
                      variant={authTab === 'register' ? 'contained' : 'outlined'}
                      onClick={() => setAuthTab('register')}
                    >
                      Register
                    </Button>
                  </Box>
                  {authTab === 'register' && (
                    <TextField
                      label="Full Name"
                      value={authForm.name}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  )}
                  <TextField
                    label="Email"
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  {authError && <Alert severity="error">{authError}</Alert>}
                  <Button type="submit" variant="contained" disabled={authLoading}>
                    {authLoading ? <CircularProgress size={22} /> : authTab === 'login' ? 'Login' : 'Register'}
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                You are logged in. Continue with saved addresses on the left.
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Order summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Items: {items.length}
            </Typography>
            <Typography variant="h6" mt={1}>
              Total: Rs. {total}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default ModernCheckoutPage

