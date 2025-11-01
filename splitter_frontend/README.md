# Bill Splitter Frontend Application

A modern React frontend application for splitting bills with friends using OCR technology to extract information from receipt images.

## Features

- **📸 Bill Upload**: Upload receipt images with drag-and-drop support
- **🔍 OCR Processing**: Automatic text extraction from receipt images using OpenAI API
- **📋 Bill Review**: Review extracted bill information before proceeding
- **👥 User Management**: Add and manage users for bill splitting
- **🧮 Item Splitting**: Assign shares for each item to calculate individual costs
- **💰 Final Calculation**: View final amounts owed by each person
- **📥 Download Summary**: Export bill split summary as text file

## Backend API Integration

This frontend integrates with the following backend endpoints:

### OCR Endpoints (`/ocr`)

- `POST /ocr/extract` - Extract text from receipt image using OpenAI API
- `POST /ocr/receipt` - Save bill data to database
- `GET /ocr/receipt?id={id}` - Retrieve bill data by ID

### Split Endpoints (`/math`)

- `POST /math/users` - Add users to bill split
- `GET /math/users?receiptId={id}` - Get users for a bill
- `POST /math/share?receiptId={id}` - Save bill splits
- `GET /math/split?receiptId={id}` - Get final calculations

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8080`
- OpenAI API key configured in backend

## Installation

1. Navigate to the frontend directory:

   ```bash
   cd splitter_frontend
   ```

2. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage Flow

1. **Upload Bill**: Take a photo or upload an image of your receipt
2. **Review Bill**: Check the extracted information (store name, items, totals)
3. **Add Users**: Add people who will be splitting the bill
4. **Split Items**: Assign shares for each item to each user
5. **Final Calculation**: View how much each person owes
6. **Download Summary**: Export the results for your records

## Technology Stack

- **React 19** - Frontend framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library
- **CSS3** - Modern styling with gradients and animations

## Project Structure

```
splitter_frontend/
├── src/
│   ├── components/
│   │   ├── BillUpload.jsx      # Bill image upload component
│   │   ├── BillDetails.jsx     # Bill information review
│   │   ├── UserManagement.jsx  # User addition/management
│   │   ├── BillSplitting.jsx   # Item splitting interface
│   │   └── FinalCalculation.jsx # Final results display
│   ├── services/
│   │   └── api.js              # Backend API integration
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # Application styles
│   └── main.jsx                # Application entry point
├── package.json
└── README.md
```

## Styling Features

- **Modern Design**: Clean, card-based layout with gradients
- **Responsive**: Mobile-friendly design
- **Step Indicator**: Visual progress tracking
- **Loading States**: Spinners and loading indicators
- **Error Handling**: User-friendly error messages
- **Animations**: Smooth transitions and hover effects

## Error Handling & Offline Mode

The application includes comprehensive error handling and offline capabilities:

### Error Handling

- File upload validation (type, size)
- API communication errors with graceful fallbacks
- User input validation
- Network connectivity issues
- JSON parsing errors
- React Error Boundary for unexpected errors

### Offline/Fallback Mode

- **Automatic Fallback**: When backend services are unavailable (500 errors, network issues), the app automatically switches to local calculations
- **User-Friendly Messages**: Clear error messages inform users when running in offline mode
- **Local Calculations**: All bill splitting calculations work locally even without backend connectivity
- **Data Persistence**: User data and calculations persist in the browser session
- **Visual Indicators**: Offline mode indicator appears in the header when backend services are unavailable

### Backend Error Handling

- **500 Internal Server Error**: Automatically falls back to local mode
- **404 Not Found**: Uses local calculations when endpoints are missing
- **Network Errors**: Continues with local data when connection fails
- **Graceful Degradation**: App remains fully functional even with backend issues

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

To run in development mode:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To preview production build:

```bash
npm run preview
```

## API Data Models

The frontend expects the following data structures from the backend:

### BillsDTO

```javascript
{
  id: number,
  storeName: string,
  storeAddress: string,
  date: string,
  time: string,
  subTotal: number,
  taxTotal: number,
  total: number,
  items: ItemsDTO[]
}
```

### ItemsDTO

```javascript
{
  id: number,
  description: string,
  price: number
}
```

### UsersDTO

```javascript
{
  userId: number,
  receiptId: number,
  name: string,
  amount: number
}
```

### Split Model

```javascript
{
  itemId: number,
  itemName: string,
  price: number,
  shares: Share[]
}
```

### Share Model

```javascript
{
  userId: number,
  share: number,
  cost: number
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
