import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
} from '@mui/material';
import TodaySchedule from '../components/schedules/TodaySchedule';
import WeeklySchedule from '../components/schedules/WeeklySchedule';
import MonthlySchedule from '../components/schedules/MonthlySchedule';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AutomationPosts() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Automation Posts
      </Typography>
      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Today" />
          <Tab label="Weekly" />
          <Tab label="Monthly" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <TodaySchedule />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <WeeklySchedule />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <MonthlySchedule />
        </TabPanel>
      </Paper>
    </Box>
  );
}

