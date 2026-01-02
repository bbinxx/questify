# Questify

**Interactive Presentations & Real-time Audience Engagement Platform**

Questify is a modern web application for creating and hosting interactive presentations. Engage your audience with live polls, quizzes, Q&A sessions, and word clouds in real-time. Built with Next.js 14, Supabase, and Socket.IO.

## ✨ Features

- **Interactive Slide Types**:
  - **Multiple Choice**: Real-time voting with bar charts.
  - **Word Cloud**: Visual representation of audience responses.
  - **Q&A**: Live questions with upvoting capabilities.
  - **Quiz Mode**: Gamified questions with points and timers.
  - **Scales & Ranking**: gather opinion data.
  - **Text & Content**: Standard slides for information.

- **Real-time Engagement**:
  - Instant updates via Socket.IO.
  - Live vote counting and result visualization.
  - Presenter controls (next/prev slide, show/hide results).
  - Mobile-responsive participant view.

- **Platform**:
  - **Authentication**: Secure login via Supabase Auth.
  - **PWA Support**: Installable on mobile devices.
  - **Analytics**: Track participation and response rates.
  - **Theming**: Custom themes and dark mode support.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Radix UI.
- **Backend Service**: Supabase (PostgreSQL, Authentication).
- **Real-time Server**: Custom Node.js + Socket.IO server (Express).
- **Icons**: Lucide React.
- **Visuals**: Framer Motion / Tailwind Animate for smooth transitions.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or pnpm
- A [Supabase](https://supabase.com/) project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/bbinxx/questify.git
    cd questify
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add the following:

    ```env
    # Supabase (Get these from your Supabase Project Settings)
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

    # Socket.IO Server Configuration
    SOCKET_PORT=3001
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    # Use the same port as SOCKET_PORT above
    NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    ```

4.  **Database Setup**
    Run the provided setup SQL script in your Supabase SQL Editor to create the necessary tables, functions, and policies.

    - Copy the contents of `supabase_setup.sql` located in the root directory.
    - Paste it into the SQL Editor of your Supabase dashboard and run it.
    - (Optional) Run `reset_schema.sql` if you need to start fresh.

### Running the Application

To run both the Next.js frontend and the Socket.IO server concurrently:

```bash
npm run dev:full
```

Or run them in separate terminals:

```bash
# Terminal 1: Socket Server
npm run socket:dev

# Terminal 2: Next.js Frontend
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Socket Server**: [http://localhost:3001](http://localhost:3001)

## 📂 Project Structure

- `app/` - Next.js App Router pages and layouts.
- `components/` - Reusable UI components and slide templates.
- `lib/` - Utilities, database helpers, and configuration.
- `server/` - Socket.IO server implementation (`socket-server.ts`).
- `supabase_setup.sql` - Complete database schema definition.
- `public/` - Static assets and PWA icons.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.