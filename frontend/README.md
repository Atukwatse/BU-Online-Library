# BU Online Library - React Frontend

Modern React frontend for Bugema University Online Library, built with Vite, React Router, and Tailwind CSS.

## Features

- **User Authentication**: Login, registration, and role-based access control
- **Dashboard**: Role-specific dashboards (Admin, Staff, Student)
- **Book Management**: Browse, search, and filter e-books
- **Borrowing System**: Request and track borrowed books
- **Notifications**: Real-time notification system
- **Events**: Browse and register for library events
- **Services**: Access to various library services

## Tech Stack

- React 18
- Vite
- React Router 6
- Tailwind CSS
- Axios (for API communication)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your API base URL:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3001`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   └── Navigation.jsx
│   ├── context/         # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Resources.jsx
│   │   ├── Services.jsx
│   │   ├── Events.jsx
│   │   └── dashboard/
│   │       ├── AdminDashboard.jsx
│   │       ├── StaffDashboard.jsx
│   │       └── UserDashboard.jsx
│   ├── services/        # API service layer
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## API Integration

The frontend communicates with the backend through the API service layer (`src/services/api.js`). All API calls include:

- Automatic token injection from localStorage
- Error handling
- Response interceptors for authentication

### Authentication

The `AuthContext` provides:
- `login()` - User login
- `register()` - User registration
- `logout()` - User logout
- `user` - Current user object
- `isAuthenticated` - Authentication status
- Role helpers: `isAdmin()`, `isStaff()`, `isStudent()`

### Protected Routes

Protected routes automatically redirect to login if the user is not authenticated.

## Available Pages

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/about` - About page
- `/contact` - Contact/Help page
- `/resources` - E-Books collection
- `/services` - Library services
- `/events` - Digital events
- `/admin/dashboard` - Admin dashboard (Admin/SuperAdmin only)
- `/staff/dashboard` - Staff dashboard (Staff/Admin/SuperAdmin only)
- `/user/dashboard` - User dashboard (all authenticated users)

## Styling

The project uses Tailwind CSS with custom theme colors:

- Primary: `#003366` (Blue)
- Secondary: `#FFCC00` (Yellow)

Custom utility classes are defined in `src/index.css`.

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Update the Navigation component if needed

### Adding New API Endpoints

1. Add the endpoint function in `src/services/api.js`
2. Use the function in your component with proper error handling

### Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:3000/api)

## Deployment

### Deploy to Vercel

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Vercel

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

### Docker

See the main project README for Docker deployment instructions.

## Troubleshooting

### API Connection Issues

- Ensure the backend server is running on port 3000
- Check the `VITE_API_BASE_URL` in `.env`
- Verify CORS settings in the backend

### Authentication Issues

- Check localStorage for token
- Verify JWT secret matches between frontend and backend
- Check browser console for errors

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

UNLICENSED - Bugema University
