# SmartCane-Admin

SmartCane-Admin is a modern web dashboard for configuring and monitoring the Smart Cane device, designed to assist visually impaired users. This application allows you to connect to the Smart Cane via Serial (Web Serial API), view real-time sensor data, manage emergency contacts, and customize alert messages.

## Features

- **Device Connection:** Connect to the Smart Cane via Serial (Chrome required).
- **Real-time Monitoring:** View live distance, weather (rain detection), and GPS location from the cane.
- **Alert System:** Receive warnings for obstacles and rain.
- **Message Template:** Customize the emergency SMS template with live GPS location.
- **Phone Number Management:** Add, edit, or remove emergency contact numbers.
- **Configuration Save:** Save all settings directly to the device for offline use.
- **Demo Mode:** Simulate device data in preview environments (localhost, Vercel, Netlify).

## Technologies Used

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) (animations)
- [Lucide Icons](https://lucide.dev/)
- Web Serial API

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- Chrome or Edge browser (for Serial connection)

### Installation

```bash
git clone https://github.com/xinchaoduyanh/SmartCane-Admin.git
cd SmartCane-Admin
npm install
# or
yarn install
```

### Running Locally

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Usage

1. Connect your Smart Cane device via USB.
2. Click "Connect Device" in the dashboard.
3. Monitor real-time data and configure settings as needed.
4. Save your configuration to the device.

> **Note:** In demo mode (localhost, Vercel, Netlify), device data is simulated for preview purposes.

## License

This project is for educational and research purposes.

---

**Developed by [xinchaoduyanh](https://github.com/xinchaoduyanh)**