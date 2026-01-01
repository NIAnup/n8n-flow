import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Grid,
} from '@mui/material';
import axios from 'axios';

export default function TodaySchedule() {
  const [formData, setFormData] = useState({
    topic: '',
    explanation: '',
    tone: 'professional',
    aiModel: 'chatgpt',
    platforms: [],
    postTime: '',
    generateImage: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'platforms') {
      const platforms = formData.platforms.includes(value)
        ? formData.platforms.filter((p) => p !== value)
        : [...formData.platforms, value];
      setFormData({ ...formData, platforms });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/schedules/today', formData);
      setMessage('Post scheduled successfully!');
      setFormData({
        topic: '',
        explanation: '',
        tone: 'professional',
        aiModel: 'chatgpt',
        platforms: [],
        postTime: '',
        generateImage: false,
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Short Explanation"
            name="explanation"
            value={formData.explanation}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Tone</InputLabel>
            <Select
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              label="Tone"
            >
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="educational">Educational</MenuItem>
              <MenuItem value="promotional">Promotional</MenuItem>
              <MenuItem value="casual">Casual</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>AI Model</InputLabel>
            <Select
              name="aiModel"
              value={formData.aiModel}
              onChange={handleChange}
              label="AI Model"
            >
              <MenuItem value="chatgpt">ChatGPT</MenuItem>
              <MenuItem value="gemini">Gemini</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Platforms
          </Typography>
          {['linkedin', 'facebook', 'twitter', 'instagram'].map((platform) => (
            <FormControlLabel
              key={platform}
              control={
                <Checkbox
                  checked={formData.platforms.includes(platform)}
                  onChange={handleChange}
                  value={platform}
                  name="platforms"
                />
              }
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            />
          ))}
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Post Time"
            name="postTime"
            value={formData.postTime}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                name="generateImage"
                checked={formData.generateImage}
                onChange={handleChange}
              />
            }
            label="Generate Image"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || formData.platforms.length === 0}
          >
            {loading ? 'Scheduling...' : 'Schedule Post'}
          </Button>
          {message && (
            <Typography
              variant="body2"
              color={message.includes('success') ? 'success.main' : 'error.main'}
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

