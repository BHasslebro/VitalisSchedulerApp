# Vitalis Seminar Scheduler

A React application for scheduling and managing seminars from Vitalis. This application allows users to browse, filter, and select seminars across different days in both calendar and list views.

## Disclaimer

**This application is not affiliated with, endorsed by, or connected to Vitalis in any way.** It is an independent tool created for educational and personal use only. All Vitalis trademarks, service marks, trade names, and logos are the property of their respective owners.

## Project Overview

The Vitalis Scheduler application provides the following features:
- Browse seminars in calendar or list view
- Filter seminars by language, subject, target audience, and knowledge level
- Select and track seminars of interest
- Check for scheduling conflicts between selected seminars
- Share seminar selections via URL

## Application Structure

The application has been refactored into a component-based architecture:

- **VitalisScheduler.js**: Main component that manages state and renders child components
- **Components**:
  - **CalendarView.js**: Displays seminars in a calendar format
  - **ListView.js**: Displays seminars in a list format
  - **FilterPanel.js**: Provides filtering options for seminars
  - **SelectedSeminarsPanel.js**: Shows selected seminars and manages conflicts
  - **DaySelector.js**: Allows users to switch between different days

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd vitalis-scheduler

# Install dependencies
npm install
```

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Usage

1. Browse seminars in either calendar or list view
2. Use the filter panel to narrow down seminars by various criteria
3. Click on seminars to select/deselect them
4. View your selected seminars in the dedicated panel
5. Share your selection by copying the URL

## State Management

The application uses URL-based state management to allow sharing of seminar selections and filter settings. The state is compressed and stored in the URL query string.

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
