// Calculate daily calorie needs using Mifflin-St Jeor Equation
export const calculateDailyCalories = (profile) => {
  if (!profile || !profile.age || !profile.height || !profile.weight) {
    return 0;
  }

  // Mifflin-St Jeor Equation
  // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
  // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
  
  let bmr;
  if (profile.gender === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityMultipliers[profile.activityLevel] || 1.55);

  // Adjust for goal
  let targetCalories;
  switch (profile.goal) {
    case 'lose':
      // 500 calorie deficit per day = ~0.5kg weight loss per week
      targetCalories = tdee - 500;
      break;
    case 'gain':
      // 500 calorie surplus per day = ~0.5kg weight gain per week
      targetCalories = tdee + 500;
      break;
    case 'maintain':
    default:
      targetCalories = tdee;
      break;
  }

  return Math.round(targetCalories);
};

// Calculate macronutrient distribution
export const calculateMacros = (calories) => {
  // Standard macro distribution: 30% protein, 40% carbs, 30% fat
  const protein = Math.round((calories * 0.30) / 4); // 4 cal per gram of protein
  const carbs = Math.round((calories * 0.40) / 4);   // 4 cal per gram of carbs
  const fat = Math.round((calories * 0.30) / 9);     // 9 cal per gram of fat

  return { protein, carbs, fat };
};

// Calculate BMI
export const calculateBMI = (weight, height) => {
  // BMI = weight(kg) / (height(m))^2
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10;
};

// Get BMI category
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};
