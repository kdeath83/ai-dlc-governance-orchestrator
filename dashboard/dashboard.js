/**
 * AI-DLC Governance Orchestrator — Executive Dashboard
 * Renders compliance metrics for the three AI-DLC stages
 */

class Dashboard {
  constructor() {
    this.currentJurisdiction = 'MAS-SG';
    this.charts = {};
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderDashboard();
  }

  setupEventListeners() {
    // Jurisdiction selector
    document.getElementById('jurisdiction-selector').addEventListener('change', (e) => {
      this.currentJurisdiction = e.target.value;
      this.renderDashboard();
    });

    // Activity filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.renderActivityLog(e.target.dataset.filter);
      });
    });
  }

  getData() {
    return window.DEMO_DATA[this.currentJurisdiction];
  }

  renderDashboard() {
    const data = this.getData();
    
    // Update overall status
    const statusBadge = document.getElementById('overall-status');
    statusBadge.textContent = data.overall;
    statusBadge.className = 'status-badge';
    if (data.overall === 'Warning') {
      statusBadge.classList.add('warning');
    } else if (data.overall === 'Critical') {
      statusBadge.classList.add('critical');
    }

    // Render each stage
    this.renderStage('steering', data.steering);
    this.renderStage('traceability', data.traceability);
    this.renderStage('gate', data.gate);

    // Render activity log
    this.renderActivityLog('all');

    // Render trend chart
    this.renderTrendChart(data.trend);
  }

  renderStage(stage, data) {
    // Update metrics
    const metricsMap = {
      steering: {
        'steering-files': data.files,
        'steering-rules': data.rules,
        'steering-coverage': data.coverage + '%'
      },
      traceability: {
        'audit-pass': data.passRate + '%',
        'ai-detected': data.aiCommits,
        'req-linked': data.reqLinked + '%'
      },
      gate: {
        'gate-pass': data.passRate + '%',
        'material-blocked': data.blocked,
        'human-reviewed': data.humanReviewed
      }
    };

    const metrics = metricsMap[stage];
    for (const [id, value] of Object.entries(metrics)) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
      }
    }

    // Update stage status
    const statusEl = document.getElementById(`${stage}-status`);
    const cardEl = document.getElementById(`stage-${stage}`);
    
    if (stage === 'steering') {
      statusEl.textContent = '✓';
      statusEl.className = 'stage-status';
      cardEl.classList.add('active');
    } else if (stage === 'traceability') {
      if (data.passRate >= 90) {
        statusEl.textContent = '✓';
        statusEl.className = 'stage-status';
        cardEl.classList.add('active');
      } else {
        statusEl.textContent = '⚠';
        statusEl.className = 'stage-status warning';
        cardEl.classList.remove('active');
      }
    } else if (stage === 'gate') {
      if (data.passRate >= 95) {
        statusEl.textContent = '✓';
        statusEl.className = 'stage-status';
        cardEl.classList.add('active');
      } else {
        statusEl.textContent = '⚠';
        statusEl.className = 'stage-status warning';
        cardEl.classList.remove('active');
      }
    }

    // Render chart
    this.renderStageChart(stage, data.chart);
  }

  renderStageChart(stage, chartData) {
    const canvasId = `${stage}-chart`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destroy existing chart
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const colors = {
      steering: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
      traceability: ['#10b981', '#ef4444'],
      gate: ['#10b981', '#f59e0b']
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: stage === 'steering' ? 'doughnut' : 'pie',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: colors[stage],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: stage === 'steering' ? '60%' : 0
      }
    });
  }

  renderActivityLog(filter) {
    const data = this.getData();
    let activities = data.activities;

    if (filter !== 'all') {
      activities = activities.filter(a => a.type.toLowerCase() === filter);
    }

    const tbody = document.getElementById('activity-body');
    tbody.innerHTML = activities.map(activity => {
      const statusClass = activity.status === 'Pass' ? 'status-pass' : 
                         activity.status === 'Blocked' ? 'status-blocked' : 'status-fail';
      
      return `
        <tr>
          <td>${activity.time}</td>
          <td><span class="status-cell ${statusClass}">${activity.type}</span></td>
          <td>${activity.jurisdiction}</td>
          <td><span class="status-cell ${statusClass}">${activity.status}</span></td>
          <td>${activity.details}</td>
        </tr>
      `;
    }).join('');
  }

  renderTrendChart(trendData) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    // Destroy existing chart
    if (this.charts['trend-chart']) {
      this.charts['trend-chart'].destroy();
    }

    const ctx = canvas.getContext('2d');
    this.charts['trend-chart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Steering',
            data: trendData.steering,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Traceability',
            data: trendData.traceability,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Gate',
            data: trendData.gate,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { size: 12 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(51, 65, 85, 0.5)',
              drawBorder: false
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 }
            }
          },
          y: {
            min: 70,
            max: 105,
            grid: {
              color: 'rgba(51, 65, 85, 0.5)',
              drawBorder: false
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
  });
} else {
  new Dashboard();
}
