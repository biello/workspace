import Chart from 'chart.js/auto';

// Mock data for demonstration purposes
// In a real application, this would come from an API
const mockApiKeys = [
  'sk_test_123456789',
  'sk_live_abcdefghijk',
  'sk_test_987654321',
  'sk_live_zyxwvutsrqp'
];

const mockModels = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'llama-3-70b',
  'gemini-pro'
];

// Generate random usage data
function generateMockData() {
  const usageData = [];
  const now = new Date();
  
  // Generate data for each API key
  mockApiKeys.forEach(apiKey => {
    // Generate 1-3 models used per API key
    const numModels = Math.floor(Math.random() * 3) + 1;
    const usedModels = [];
    
    for (let i = 0; i < numModels; i++) {
      const randomModelIndex = Math.floor(Math.random() * mockModels.length);
      const model = mockModels[randomModelIndex];
      
      if (!usedModels.includes(model)) {
        usedModels.push(model);
        
        // Generate random token counts
        const inputTokens = Math.floor(Math.random() * 500000) + 10000;
        const outputTokens = Math.floor(Math.random() * 300000) + 5000;
        
        // Generate random date within the last month
        const daysAgo = Math.floor(Math.random() * 30);
        const lastUsed = new Date(now);
        lastUsed.setDate(lastUsed.getDate() - daysAgo);
        
        usageData.push({
          apiKey,
          model,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          lastUsed
        });
      }
    }
  });
  
  return usageData;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  let usageData = generateMockData();
  let modelUsageChart = null;
  let timeSeriesChart = null;
  
  // Populate API key dropdown
  const apiKeyFilter = document.getElementById('api-key-filter');
  mockApiKeys.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${key.substring(0, 8)}...`;
    apiKeyFilter.appendChild(option);
  });
  
  // Initialize charts and tables
  updateDashboard(usageData);
  
  // Event listeners
  document.getElementById('refresh-btn').addEventListener('click', () => {
    usageData = generateMockData();
    updateDashboard(usageData);
  });
  
  document.getElementById('api-key-filter').addEventListener('change', () => {
    updateDashboard(usageData);
  });
  
  document.getElementById('time-range').addEventListener('change', () => {
    updateDashboard(usageData);
  });
  
  // Function to update the entire dashboard
  function updateDashboard(data) {
    const selectedApiKey = apiKeyFilter.value;
    
    // Filter data based on selected API key
    const filteredData = selectedApiKey === 'all' 
      ? data 
      : data.filter(item => item.apiKey === selectedApiKey);
    
    updateSummaryCards(filteredData);
    updateModelUsageChart(filteredData);
    updateTimeSeriesChart(filteredData);
    updateUsageTable(filteredData);
  }
  
  // Update summary cards with aggregated data
  function updateSummaryCards(data) {
    const totalTokens = data.reduce((sum, item) => sum + item.totalTokens, 0);
    const inputTokens = data.reduce((sum, item) => sum + item.inputTokens, 0);
    const outputTokens = data.reduce((sum, item) => sum + item.outputTokens, 0);
    
    // Get unique API keys from the filtered data
    const uniqueApiKeys = [...new Set(data.map(item => item.apiKey))];
    
    document.getElementById('total-tokens').textContent = formatNumber(totalTokens);
    document.getElementById('input-tokens').textContent = formatNumber(inputTokens);
    document.getElementById('output-tokens').textContent = formatNumber(outputTokens);
    document.getElementById('active-keys').textContent = uniqueApiKeys.length;
  }
  
  // Update the model usage chart
  function updateModelUsageChart(data) {
    // Aggregate data by model
    const modelData = {};
    
    data.forEach(item => {
      if (!modelData[item.model]) {
        modelData[item.model] = {
          inputTokens: 0,
          outputTokens: 0
        };
      }
      
      modelData[item.model].inputTokens += item.inputTokens;
      modelData[item.model].outputTokens += item.outputTokens;
    });
    
    const models = Object.keys(modelData);
    const inputTokens = models.map(model => modelData[model].inputTokens);
    const outputTokens = models.map(model => modelData[model].outputTokens);
    
    // Destroy existing chart if it exists
    if (modelUsageChart) {
      modelUsageChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('model-usage-chart').getContext('2d');
    modelUsageChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: models,
        datasets: [
          {
            label: 'Input Tokens',
            data: inputTokens,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Output Tokens',
            data: outputTokens,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Token Count'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Model'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${formatNumber(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }
  
  // Update the time series chart
  function updateTimeSeriesChart(data) {
    // Group data by date
    const timeData = {};
    const selectedTimeRange = document.getElementById('time-range').value;
    const now = new Date();
    let startDate;
    
    // Determine start date based on selected time range
    switch (selectedTimeRange) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    // Filter data based on time range
    const timeFilteredData = data.filter(item => new Date(item.lastUsed) >= startDate);
    
    // Generate date labels based on time range
    const dateLabels = [];
    const dateData = [];
    
    if (selectedTimeRange === 'day') {
      // Hourly intervals for last 24 hours
      for (let i = 0; i < 24; i++) {
        const date = new Date(now);
        date.setHours(date.getHours() - i);
        date.setMinutes(0, 0, 0);
        
        const label = date.toLocaleTimeString([], { hour: '2-digit' });
        dateLabels.unshift(label);
        dateData.unshift(0);
      }
      
      // Aggregate data by hour
      timeFilteredData.forEach(item => {
        const itemDate = new Date(item.lastUsed);
        const hourIndex = Math.floor((now - itemDate) / (1000 * 60 * 60));
        
        if (hourIndex >= 0 && hourIndex < 24) {
          dateData[hourIndex] += item.totalTokens;
        }
      });
    } else if (selectedTimeRange === 'week') {
      // Daily intervals for last week
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const label = date.toLocaleDateString([], { weekday: 'short' });
        dateLabels.unshift(label);
        dateData.unshift(0);
      }
      
      // Aggregate data by day
      timeFilteredData.forEach(item => {
        const itemDate = new Date(item.lastUsed);
        itemDate.setHours(0, 0, 0, 0);
        const dayIndex = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        
        if (dayIndex >= 0 && dayIndex < 7) {
          dateData[dayIndex] += item.totalTokens;
        }
      });
    } else if (selectedTimeRange === 'month') {
      // Generate last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        dateLabels.unshift(label);
        dateData.unshift(0);
      }
      
      // Aggregate data by day
      timeFilteredData.forEach(item => {
        const itemDate = new Date(item.lastUsed);
        itemDate.setHours(0, 0, 0, 0);
        const dayIndex = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        
        if (dayIndex >= 0 && dayIndex < 30) {
          dateData[dayIndex] += item.totalTokens;
        }
      });
    } else if (selectedTimeRange === 'year') {
      // Monthly intervals for last year
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        
        const label = date.toLocaleDateString([], { month: 'short' });
        dateLabels.unshift(label);
        dateData.unshift(0);
      }
      
      // Aggregate data by month
      timeFilteredData.forEach(item => {
        const itemDate = new Date(item.lastUsed);
        const monthDiff = (now.getFullYear() - itemDate.getFullYear()) * 12 + 
                          (now.getMonth() - itemDate.getMonth());
        
        if (monthDiff >= 0 && monthDiff < 12) {
          dateData[monthDiff] += item.totalTokens;
        }
      });
    }
    
    // Destroy existing chart if it exists
    if (timeSeriesChart) {
      timeSeriesChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('time-series-chart').getContext('2d');
    timeSeriesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dateLabels,
        datasets: [
          {
            label: 'Total Tokens',
            data: dateData,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Token Count'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time Period'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${formatNumber(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }
  
  // Update the usage table
  function updateUsageTable(data) {
    const tableBody = document.querySelector('#usage-table tbody');
    tableBody.innerHTML = '';
    
    // Sort data by total tokens (descending)
    const sortedData = [...data].sort((a, b) => b.totalTokens - a.totalTokens);
    
    sortedData.forEach(item => {
      const row = document.createElement('tr');
      
      // Format API key to show only first and last few characters
      const maskedApiKey = `${item.apiKey.substring(0, 8)}...${item.apiKey.substring(item.apiKey.length - 4)}`;
      
      row.innerHTML = `
        <td>${maskedApiKey}</td>
        <td>${item.model}</td>
        <td>${formatNumber(item.inputTokens)}</td>
        <td>${formatNumber(item.outputTokens)}</td>
        <td>${formatNumber(item.totalTokens)}</td>
        <td>${formatDate(item.lastUsed)}</td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Show message if no data
    if (sortedData.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="6" style="text-align: center;">No data available</td>`;
      tableBody.appendChild(row);
    }
  }
  
  // Helper function to format numbers with commas
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Helper function to format dates
  function formatDate(date) {
    return new Date(date).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
});