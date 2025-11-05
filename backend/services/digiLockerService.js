const DigiLocker = require('../models/DigiLocker');

class DigiLockerService {
  
  static async verifyDigiLockerID(digilockerID) {
    try {
      const user = await DigiLocker.findOne({ digilockerID: digilockerID });
      
      return {
        isValid: !!user,
        userData: user || null
      };
    } catch (error) {
      console.error('Error verifying DigiLocker ID:', error);
      return {
        isValid: false,
        userData: null
      };
    }
  }

  static async getUserData(digilockerID) {
    try {
      return await DigiLocker.findOne({ digilockerID: digilockerID });
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static checkEligibility(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return {
      isEligible: age >= 18,
      age: age
    };
  }

  static async simulateVerification(digilockerID) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verification = await this.verifyDigiLockerID(digilockerID);
    
    if (!verification.isValid) {
      throw new Error('DigiLocker ID not found in government database');
    }

    const eligibility = this.checkEligibility(verification.userData.dateOfBirth);
    
    if (!eligibility.isEligible) {
      throw new Error(`Applicant must be 18+ years old. Current age: ${eligibility.age}`);
    }

    return {
      success: true,
      message: 'DigiLocker verification successful',
      userData: verification.userData,
      eligibility: eligibility
    };
  }

  static async getAllValidIDs() {
    try {
      const digilockers = await DigiLocker.find({}, 'digilockerID').sort({ digilockerID: 1 });
      return digilockers.map(dl => dl.digilockerID);
    } catch (error) {
      console.error('Error getting valid IDs:', error);
      return [];
    }
  }

  static async getAllRecords() {
    try {
      return await DigiLocker.find({}).sort({ digilockerID: 1 });
    } catch (error) {
      console.error('Error getting all records:', error);
      return [];
    }
  }
}

module.exports = DigiLockerService;