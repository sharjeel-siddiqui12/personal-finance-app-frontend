# Personal Finance App Frontend

A modern, responsive web application for managing personal finances, built with React, Vite, and Tailwind CSS.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Configuration](#configuration)
- [Folder Overview](#folder-overview)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (login/register)
- Dashboard with summary and graphs
- Transaction management (add, list, edit, delete)
- Budget tracking
- Savings goals
- Reports and analytics
- Theme toggle (light/dark mode)
- Admin panel for privileged users
- Responsive design

## Tech Stack

- **Frontend:** React (with hooks and context API)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, PostCSS
- **Linting:** ESLint
- **State Management:** React Context
- **API Communication:** Axios (via custom services)
- **Icons/Assets:** SVG

## Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images and SVGs
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React context providers
│   ├── pages/             # Route-based pages
│   ├── services/          # API and business logic
│   ├── App.jsx            # Main app component
│   ├── App.css            # App-level styles
│   ├── index.css          # Global styles
│   ├── main.jsx           # Entry point
├── index.html             # HTML template
├── package.json           # Project metadata and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── eslint.config.js       # ESLint configuration
├── README.md              # Project documentation
└── LICENSE                # License file
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```sh
npm install
```

### Running the App

```sh
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

## Available Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run preview` – Preview production build
- `npm run lint` – Run ESLint

## Configuration

- **Tailwind CSS:** Configured via `tailwind.config.js`
- **PostCSS:** Configured via `postcss.config.js`
- **ESLint:** Configured via `eslint.config.js`
- **Vite:** Configured via `vite.config.js`

## Folder Overview

- **`src/components/`**: AuthForm, DashboardGraphs, DashboardSummary, Layout, ThemeToggle, TransactionForm, TransactionList
- **`src/contexts/`**: AuthContext, ThemeContext
- **`src/pages/`**: AdminPanel, Budgets, Dashboard, Login, Register, Reports, SavingsGoals, Settings, Transactions
- **`src/services/`**: api.js, authService.js, goalService.js

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License

This project is licensed under the terms of the LICENSE file.
