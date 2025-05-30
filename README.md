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

### Sneak peak into the project

**Overview of the project:**

![Screenshot 2025-05-29 160746](https://github.com/user-attachments/assets/56d20c20-a4a6-403b-acdf-7f65e372c037)

- Alert System for automatic alerts:

![image](https://github.com/user-attachments/assets/d2be92dd-043e-4841-9a5e-de4a2a80e40f)

- AI assistant for easy maintanance and optimization:

![image](https://github.com/user-attachments/assets/e98448d8-f3f3-4ffa-b3c8-29b5af41425d)

- Live metrics analytics tabs [Network analysis tab below]:

![image](https://github.com/user-attachments/assets/092d3596-7759-4454-8812-71c825e39be2)
  
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
![image](https://github.com/user-attachments/assets/8912c73b-c2dc-46e0-bf9e-6a7d25e2ac1b)
- Replace the gemini api key with your own:
  
### Here is how to generate your own gemini api key:
To obtain a Gemini API key, you need to sign up for a Google AI Studio account and create a new key within your account or select an existing Google Cloud Project. Once created, you can copy and save the key for use in your applications. 

#### Here's a step-by-step guide:
- **1. Sign in to Google AI Studio:**
Navigate to the Google AI Studio website and log in with your Google account. 
- **2. Create an API key:**
Once logged in, you'll find instructions to create an API key. You can either create a new key or select an existing Google Cloud Project. 
- **3. Agree to terms and conditions:**
You'll be prompted to agree to the Gemini API's terms of service and privacy policy and may be asked if you'd like to receive email updates. 
- **4. Create the API key:**
Click "Create API key" to generate your API key. 
- **5. Copy and save the key:**
Once the API key is generated, copy it and store it securely. This key will be required for accessing the Gemini API in your applications.
 
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
- ![Screenshot 2025-05-29 160213](https://github.com/user-attachments/assets/ac1e34d1-fbf4-435f-9350-f20a18f5822c)
![image](https://github.com/user-attachments/assets/385453fd-2bdb-45f1-8890-5b8de8a74015)
- **Multi-Server Support:** Extend the agent and backend to monitor multiple servers simultaneously.
![Screenshot 2025-05-29 160203](https://github.com/user-attachments/assets/1c473e5a-5157-4c07-b9f2-ae65c67a746e)
![Screenshot 2025-05-29 160152](https://github.com/user-attachments/assets/55e70697-e055-4822-b852-1cf003844e17)

- **Historical Data Analysis:** Store metrics in a database (e.g., MongoDB, PostgreSQL) for trend analysis and historical reporting.

- **Authentication:** Implement user authentication for secure access to the dashboard.

- **Mobile Support:** Optimize the frontend for mobile devices or create a dedicated mobile app.

- **Advanced Metrics:** Include additional metrics like disk I/O, process monitoring, or application-specific data.

### Contributing
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request with your changes. Ensure your code follows the project’s coding standards and includes appropriate tests.
