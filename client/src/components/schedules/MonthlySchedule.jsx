import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import axios from 'axios';

export default function MonthlySchedule() {
  const [formData, setFormData] = useState({
    industry: '',
    targetAudience: '',
    contentGoal: 'branding',
    generateImage: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/schedules/monthly', formData);
      setMessage('Monthly schedule created successfully!');
      setFormData({
        industry: '',
        targetAudience: '',
        contentGoal: 'branding',
        generateImage: false,
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Create Monthly Schedule
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
        AI will generate 30 unique topics based on your industry and target audience.
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            required
            placeholder="e.g., Technology, Healthcare, Finance"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Target Audience"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            required
            placeholder="e.g., Small business owners, Marketing professionals"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Content Goal</InputLabel>
            <Select
              name="contentGoal"
              value={formData.contentGoal}
              onChange={handleChange}
              label="Content Goal"
            >
              <MenuItem value="branding">Branding</MenuItem>
              <MenuItem value="leads">Lead Generation</MenuItem>
              <MenuItem value="engagement">Engagement</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Generating Schedule...' : 'Generate Monthly Schedule'}
          </Button>
          {message && (
            <Alert
              severity={message.includes('success') ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

