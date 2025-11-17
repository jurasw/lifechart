export interface Micronutrients {
  vitaminA?: number // in mcg
  vitaminC?: number // in mg
  vitaminD?: number // in mcg
  vitaminE?: number // in mg
  vitaminK?: number // in mcg
  thiamin?: number // in mg
  riboflavin?: number // in mg
  niacin?: number // in mg
  vitaminB6?: number // in mg
  folate?: number // in mcg
  vitaminB12?: number // in mcg
  biotin?: number // in mcg
  pantothenicAcid?: number // in mg
  choline?: number // in mg
  calcium?: number // in mg
  iron?: number // in mg
  magnesium?: number // in mg
  phosphorus?: number // in mg
  potassium?: number // in mg
  sodium?: number // in mg
  zinc?: number // in mg
  copper?: number // in mg
  manganese?: number // in mg
  selenium?: number // in mcg
  chromium?: number // in mcg
  molybdenum?: number // in mcg
  iodine?: number // in mcg
}

export interface DailyDish {
  id: string
  date: number // timestamp for the day (start of day)
  name: string
  kcal: number
  protein: number // in grams
  carbs: number // in grams
  fats: number // in grams
  fiber?: number // in grams
  micronutrients?: Micronutrients
  notes?: string
  createdAt: number
}

