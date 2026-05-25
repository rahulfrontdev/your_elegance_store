import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Container, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { clearAuthError, loginUser, registerUser } from '../../redux/authSlice'

const ModernAuthPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((state) => state.auth)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearAuthError())
    const action =
      mode === 'login'
        ? await dispatch(loginUser({ email: form.email, password: form.password }))
        : await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }))

    if (!action.error) navigate('/modern/checkout')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={2}>
            {mode === 'login' ? 'Login' : 'Create account'}
          </Typography>
          <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 2 }}>
            <Tab value="login" label="Login" />
            <Tab value="register" label="Register" />
          </Tabs>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {mode === 'register' && (
                <TextField
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              )}
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default ModernAuthPage

