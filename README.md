# About
Servify is a server management and monitoring tool designed to provide real-time insights into server performance. 
It consists of three main components: an agent that collects server metrics, a backend that processes and serves the data, and a frontend dashboard that visualizes key metrics such as CPU usage, memory consumption, and network activity. 
Built with modern technologies like Node.js and React, Servify aims to simplify server health monitoring for developers and system administrators. 

# What This Project Does
### Servify enables users to:
- Monitor server health by collecting real-time data on CPU, memory, and network usage via a lightweight agent.
- Visualize metrics through an intuitive web-based dashboard with interactive charts.
- Manage servers efficiently by centralizing monitoring to detect performance issues or bottlenecks.

### The project is structured into three directories:
- agents/: A Node.js-based agent that runs on servers to collect metrics and send them to the backend.
- backend/: A Node.js server (likely using Express) that processes agent data and provides APIs for the frontend.
- frontend/: A React-based web application with components for rendering CPU, memory, and network charts.
  
# How to Set Up Locally
### Follow these steps to set up and run Servify on your local machine. Ensure you have Node.js (v14 or higher) and npm installed.
**Prerequisites**
- Node.js (v14 or higher)
- npm
- Git
- A server environment to run the agent (e.g., Linux, Windows, or macOS)

### Setup Instructions

#### 1. Clone the Repository

```
git clone https://github.com/Abhishekraina7/Servify.git
cd Servify

```

#### 2. Set Up the Agent
- Navigate to the agents directory:
```
cd agents

```
- Install dependencies:
```
npm install

```
- Run the agent installation script (for Linux/macOS):
```
node install.js

```
**For Windows, use:**

```
node install-windows-service.js

```

Start the agent:

```
node agent.js

```

-The agent will begin collecting server metrics and sending them to the backend.

#### 3. Set Up the Backend

- Navigate to the backend directory:
```
 cd ../backend
```
- Install dependencies:
```
npm install

```
- Start the backend server:
```
node server.js

```
- The backend will run on http://localhost:3000 (or the configured port) and expose APIs for the frontend.

#### 4. Set Up the Frontend
- Navigate to the frontend/client directory:
```
cd ../frontend/client

```
- Install dependencies:
```
npm install

```
- Start the React development server:
```
npm start

```
- The frontend will open in your browser at http://localhost:3000 and display the monitoring dashboard.

#### 5.Verify the Application

- Ensure the agent is running on the target server, the backend is active, and the frontend is accessible.
- The dashboard should display real-time CPU, memory, and network charts based on data collected by the agent.

  #### Troubleshooting

- Agent Issues: Check the agent’s logs for connection errors. Ensure it can communicate with the backend.

- Backend Issues: Verify the port (default: 3000) is not in use and dependencies are installed.

- Frontend Issues: Ensure the backend API is running and accessible from the frontend. Check the browser’s developer console for errors.

 ### Future Developments

#### Servify has a solid foundation but will be enhanced with the following features:


- **Alerting System:** Add notifications (e.g., email, Slack) for critical server events like high CPU or low memory.

- **Multi-Server Support:** Extend the agent and backend to monitor multiple servers simultaneously.

- **Historical Data Analysis:** Store metrics in a database (e.g., MongoDB, PostgreSQL) for trend analysis and historical reporting.

- **Authentication:** Implement user authentication for secure access to the dashboard.

- **Mobile Support:** Optimize the frontend for mobile devices or create a dedicated mobile app.

- **Advanced Metrics:** Include additional metrics like disk I/O, process monitoring, or application-specific data.

### Contributing
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request with your changes. Ensure your code follows the project’s coding standards and includes appropriate tests.
