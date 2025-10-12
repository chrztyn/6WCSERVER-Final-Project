# Split Smart

This is our final project for **6WCSERVER** called **“Split Smart”**, built with:
- MongoDB + Express (Node.js) backend  
- Vue.js frontend  

## Features
- User Registration and Login  
- Group Creation and Member Management  
- Expense Addition and Categorization  
- Automatic Balance Calculation  
- Settlement and Payment Tracking  
- Expense Summary and Transaction History Dashboard  
- Notification and Search  

## Before Starting
Make sure you have the following installed:
- [Node.js](https://nodejs.org/)  
- [MongoDB Atlas](https://www.mongodb.com/)  

## Setting Up
Follow these steps to set up and run the project locally:
1. **Open Windows PowerShell as Administrator**
   - Run the command:  
     ```bash
     Set-ExecutionPolicy RemoteSigned
     ```
   - Type **A** to confirm.

2. **Clone the Repository**
   - Run the following commands:  
     ```bash
     git clone https://github.com/chrztyn/6WCSERVER-Final-Project.git
     cd 6WCSERVER-Final-Project
     ```

3. **Backend Setup**
   - Navigate to the backend folder:  
     ```bash
     cd backend
     ```
   - Install dependencies:  
     ```bash
     npm install
     ```
   - Create a `.env` file in the backend folder with the following variables:
     ```env
     PORT=3001
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.<cluster-id>.mongodb.net/<database-name>
     JWT_SECRET=<your-secret-key>
     ```
   - Start the backend server:  
     ```bash
     node server.js
     ```
     or  
     ```bash
     npm start
     ```
   - The backend will be available at: **http://localhost:3001**

4. **Frontend Setup**
   - Open a new terminal.  
   - Navigate to the frontend folder:  
     ```bash
     cd frontend
     ```
   - Install dependencies:  
     ```bash
     npm install
     ```
   - Start the frontend:  
     ```bash
     npm run dev
     ```
   - The frontend will be available at: **http://localhost:5173**

5. **Access the App**
   - Open your browser and go to **http://localhost:5173**  
   - The frontend will automatically connect to the backend API.

## Checklist Before Running
- `.env` file created in the backend folder  
- MongoDB Atlas cluster accessible  
- Dependencies installed (`npm install`)  
- Backend running at `http://localhost:3001`  
- Frontend running at `http://localhost:5173`  

## Contributors
- **Christine Mae D. Yunun** — Project Leader & Backend  
- **Mary Micah G. Lapuz** — UI/UX, Frontend  
- **Kyle Eishley G. Payawal** — Fullstack  
- **Maxene P. Quiambao** — Technical Writer & UI/UX  
- **Clarence Lane C. Parungao** — Technical Writer & UI/UX  

We hope you enjoy using our app as much as we enjoyed building it.  
If you have any feedback, suggestions, or just want to share your thoughts, feel free to reach out.  
Your input is always welcome and greatly appreciated.
