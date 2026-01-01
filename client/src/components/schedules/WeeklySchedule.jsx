import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export default function WeeklySchedule() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const uploadResponse = await axios.post('/api/upload/file', formData);
      await axios.post('/api/schedules/weekly', {
        fileUrl: uploadResponse.data.fileUrl,
      });
      setMessage('Weekly schedule created successfully!');
      setFile(null);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/upload/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'weekly-schedule-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage('Failed to download template');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Weekly Schedule
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Upload an Excel, CSV, or DOCX file with your weekly schedule. Download the template to see the format.
      </Typography>
      <Button
        variant="outlined"
        onClick={downloadTemplate}
        sx={{ mt: 2, mb: 2 }}
      >
        Download Template
      </Button>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        }}
      >
        <input {...getInputProps()} />
        {file ? (
          <Typography>{file.name}</Typography>
        ) : (
          <Typography>
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag & drop a file here, or click to select'}
          </Typography>
        )}
      </Box>
      {file && (
        <Button
          variant="contained"
          fullWidth
          onClick={handleUpload}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Processing...' : 'Create Weekly Schedule'}
        </Button>
      )}
      {message && (
        <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </Box>
  );
}

