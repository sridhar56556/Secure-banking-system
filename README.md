# NeoBank Simulation - Premium Banking UI

This project is a high-performance, premium banking simulation featuring:
- **Google Pay Style History**: Detailed transaction cards.
- **Instant Loans**: PAN-based credit scoring and disbursement.
- **OTP Verification**: Real-world email verification using Node.js.
- **Bank Statements**: Formal e-receipts for all transactions.

---

## 🚀 How to Put This Project Online (LIVE)

### Step 1: Push to GitHub
1. Create a new repository on GitHub named `neobank-simulation`.
2. Run these commands in your terminal:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/neobank-simulation.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy the Website (Frontend)
Once the code is on GitHub, run:
```bash
npm run deploy
```
This will create a `gh-pages` branch and host your site for free!

### Step 3: Deploy the Mail Server (Backend)
Since GitHub Pages only hosts the design, you need to host the `server.js` file for the OTPs to work.
1. Create a free account on [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the **Start Command** to `node server.js`.
5. Add your `.env` variables (EMAIL_USER, EMAIL_PASS) in the Render Dashboard under **Environment**.

### Step 4: Update the App
After Render gives you a URL (e.g., `https://neobank-backend.onrender.com`), update the `fetch` URL in `src/App.jsx` to point to it!

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, Nodemailer, Dotenv
- **Icons**: Lucide React
