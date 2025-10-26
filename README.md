# Drive-Ease - Online Driving License Application Portal

> A comprehensive MERN stack application for streamlined driving license applications with DigiLocker integration

## 🚀 Features

- **DigiLocker Authentication**: Secure verification using government DigiLocker IDs
- **5-Step Progressive Workflow**:
  1. Registration with phone OTP verification
  2. Color Vision Test Slot Booking
  3. Color Vision Test Completion
  4. Learner's Test Slot Booking
  5. Road Test Application
- **Age Eligibility Check**: Automatic verification for 18+ years
- **Daily Booking Limits**: Prevents overbooking of test slots
- **Real-time OTP Verification**: Secure phone number validation
- **Photo Upload**: Applicant photo upload with validation
- **Step Locking**: Sequential workflow - complete one step to unlock the next

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0
- **Axios** for API calls
- **CSS3** for styling

### Backend
- **Node.js** with Express.js 4.18.2
- **MongoDB** with Mongoose 7.5.0
- **CORS** enabled for cross-origin requests

## 📁 Project Structure

```
Drive-Ease/
├── backend/
│   ├── models/
│   │   ├── Application.js          # Application schema
│   │   ├── DigiLocker.js           # DigiLocker user schema
│   │   ├── Payment.js              # Payment records
│   │   ├── OTP.js                  # OTP verification
│   │   └── DailyBooking.js         # Daily test slot tracking
│   ├── routes/
│   │   ├── applicationRoutes.js    # Application endpoints
│   │   └── paymentRoutes.js        # Payment endpoints
│   ├── services/
│   │   ├── digiLockerService.js    # DigiLocker verification logic
│   │   └── otpVerificationService.js # OTP generation & verification
│   ├── server.js                   # Express server setup
│   ├── package.json
│   └── .env                        # Environment variables
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js            # DigiLocker login page
│   │   │   ├── Login.css
│   │   │   ├── ApplicationDashboard.js  # Main 5-step dashboard
│   │   │   ├── ApplicationDashboard.css
│   │   │   ├── TestDateSelector.js # Date picker component
│   │   │   └── TestDateSelector.css
│   │   ├── App.js                  # Main app component
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## 🗄️ Database Schema

### DigiLocker Collection
```javascript
{
  digilockerID: String (unique),
  fullName: String,
  fatherName: String,
  dateOfBirth: Date,
  gender: String (Male/Female/Other),
  bloodGroup: String (A+/A-/B+/B-/AB+/AB-/O+/O-),
  phone: String (10 digits),
  email: String,
  address: String,
  city: String,
  state: String,
  pincode: String (6 digits),
  isVerified: Boolean,
  createdAt: Date
}
```

### Application Collection
```javascript
{
  applicationNumber: String (auto-generated),
  digilocker: String,
  fullName: String,
  phone: String,
  email: String,
  address: String,
  state: String,
  district: String,
  pincode: String,
  photoUploaded: Boolean,
  colorTestDate: Date,
  learnerTestDate: Date,
  colorTestPassed: Boolean,
  learnerTestPassed: Boolean,
  registrationComplete: Boolean,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (if not exists):
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/drive-ease
```

4. Start the server:
```bash
npm start
```

Backend will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 📊 MongoDB Database

### Database Name
`drive-ease`

### Collections
1. **digilockers** - Government verified DigiLocker IDs
2. **applications** - Driving license applications
3. **otps** - OTP verification records
4. **dailybookings** - Daily test slot booking counts
5. **payments** - Payment transaction records

### Sample DigiLocker IDs (For Testing)
- DL12345678 - Rajesh Kumar (A+ blood group)
- DL87654321 - Priya Sharma (B+ blood group)
- DL11223344 - Arjun Singh (O+ blood group)
- DL55667788 - Anita Patel (AB+ blood group)
- DL99887766 - Karan Verma (A- blood group)

## 🔄 Application Workflow

### Step 1: Registration
- DigiLocker verification
- Auto-populated user details (name, DOB, gender, blood group)
- Photo upload
- Phone number with OTP verification
- Email address
- Complete address details

### Step 2: Color Vision Test Booking
- Select date for color vision test
- Daily limit of 50 slots enforced
- Can only proceed after registration completion

### Step 3: Color Vision Test
- Mark color vision test as passed/failed
- Admin functionality (to be marked by RTO officials)

### Step 4: Learner's Test Booking
- Select date for learner's test
- Only available after passing color vision test
- Daily limit of 50 slots enforced

### Step 5: Road Test Application
- Apply for road test
- Only available after passing learner's test
- Generates final application with unique application number

## 🔧 API Endpoints

### Application Routes (`/api/applications`)
- `POST /verify-digilocker` - Verify DigiLocker ID
- `POST /` - Submit new application
- `PUT /:id` - Update application
- `GET /` - Get all applications
- `GET /:digilocker` - Get application by DigiLocker ID
- `POST /otp/generate` - Generate OTP
- `POST /otp/verify` - Verify OTP
- `POST /check-slot-availability` - Check test slot availability
- `POST /color-test/pass` - Mark color test as passed
- `POST /learner-test/pass` - Mark learner test as passed

### Payment Routes (`/api/payments`)
- `POST /` - Process payment
- `GET /:applicationId` - Get payment by application ID

## 🎨 UI Features

### Login Page
- Clean, professional design
- DigiLocker ID input
- Real-time verification
- Error handling with user-friendly messages

### Application Dashboard
- Step indicator showing progress
- Locked/unlocked step visualization
- Form validation with error messages
- Success notifications
- Auto-save functionality
- Responsive design

## 🔒 Security Features

- DigiLocker ID verification against government database
- OTP-based phone verification
- Age eligibility check (18+ years)
- Input validation on both frontend and backend
- MongoDB schema validation
- CORS enabled for controlled access

## 📝 Recent Updates

### Display Fix (26 Oct 2025)
- ✅ Fixed name display (using `fullName` field)
- ✅ Added blood group field to DigiLocker schema
- ✅ Formatted date of birth display (DD/MM/YYYY format)
- ✅ Added fallback values for all fields
- ✅ Updated all existing database records with blood groups

### Code Cleanup
- ✅ Removed duplicate route file (applications.js)
- ✅ Consolidated all documentation into README.md
- ✅ Deleted unused components and backup files
- ✅ Renamed files for better clarity
- ✅ Removed test data from UI
- ✅ Production-ready codebase

## 🐛 Known Issues & Limitations

- OTP is currently displayed in alert (should use SMS service in production)
- Color vision test and learner's test passing requires manual admin action
- Payment integration is placeholder (needs real payment gateway)
- Photo upload stores file object but needs backend storage implementation

## 🚀 Future Enhancements

1. **SMS Integration**: Real SMS-based OTP instead of alerts
2. **Admin Panel**: Dashboard for RTO officials to manage tests
3. **Payment Gateway**: Integrate Razorpay/Stripe for actual payments
4. **File Storage**: Implement cloud storage (AWS S3) for photos
5. **Email Notifications**: Send application status updates via email
6. **PDF Generation**: Generate downloadable application receipts
7. **Document Upload**: Support for additional document uploads
8. **Multi-language Support**: Regional language options

## 📄 License

This project is developed as part of MCA 3rd Semester Software Engineering course work.

## 👥 Credits

**Developed by**: Shyam Manohar  
**Course**: MCA 3rd Semester  
**Subject**: Software Engineering  
**Institution**: [Your Institution Name]  
**Date**: October 2025

---

**Note**: This is an academic project. For production deployment, additional security measures, scalability improvements, and integration with actual government APIs would be required.
