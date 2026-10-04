# SyndicateOS Mobile (React Native + Expo)

Production React Native Mobile App for **Syndicate Real Estate Partners** and **Firm Accountants**.

Connected directly to your **Node.js + Express Backend** and **Google Cloud SQL PostgreSQL**.

---

## 🚀 Quick Start on Your Mobile Phone (Takes 2 Minutes)

### Step 1: Install Expo Go on your Phone
- **Android**: Install [Expo Go from Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: Install [Expo Go from Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Run Locally on Your PC
In your terminal, navigate to the `mobile` folder:
```bash
cd mobile
npm install
npx expo start
```

### Step 3: Scan & Open
1. A QR code will appear in your PC terminal.
2. Open the **Expo Go** app on your Android phone (or Camera app on iPhone) and scan the QR code.
3. The app will open instantly on your phone with live hot-reloading!

---

## 📱 App Features & Roles

### 1. Syndicate Partner Mobile Portal
- **Capital Account**: Displays live invested capital (e.g. ₹30,00,000 for srini) and equity share (65%).
- **Axis Bank Escrow**: Real-time passbook and project bank account balance.
- **Active Projects & Plot Matrix**: Track available, booked, and registered plots.
- **Capital Inflow Statement**: Detailed history of RTGS/NEFT partner infusions.

### 2. Firm Accountant Mobile Desk
- **Escrow Ledger**: Real-time balances and debit/credit daybook.
- **Transaction Logs**: Record payments and track contractor expenses on site.

### 3. Mobile Authentication & PIN Security
- **Firm Code Verification**: Enter firm code (`SC-AP`) to pull firm metadata.
- **Phone + 4-Digit PIN**: Secure access via mobile number.
- **Mandatory PIN Setup**: First-time users using default PIN `9999` are prompted to set their private PIN.

---

## 📦 Building Standalone Android APK (.apk)
To generate a standalone APK file for your partners without Expo Go:
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
Download the resulting `.apk` file and install it directly on any Android smartphone!
