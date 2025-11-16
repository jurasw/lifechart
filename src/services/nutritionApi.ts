export interface NutritionData {
  name: string
  kcal: number
  protein: number
  carbs: number
  fats: number
  fiber?: number
  micronutrients?: {
    vitaminA?: number
    vitaminC?: number
    vitaminD?: number
    vitaminE?: number
    vitaminK?: number
    thiamin?: number
    riboflavin?: number
    niacin?: number
    vitaminB6?: number
    folate?: number
    vitaminB12?: number
    biotin?: number
    pantothenicAcid?: number
    choline?: number
    calcium?: number
    iron?: number
    magnesium?: number
    phosphorus?: number
    potassium?: number
    sodium?: number
    zinc?: number
    copper?: number
    manganese?: number
    selenium?: number
    chromium?: number
    molybdenum?: number
    iodine?: number
  }
}

const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID || ""
const EDAMAM_APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY || ""

const OPEN_FOOD_FACTS_API = "https://world.openfoodfacts.org/cgi/search.pl"

export const searchFoodItems = async (query: string): Promise<Array<{ id: string; name: string }>> => {
  if (!query || query.length < 2) return []

  try {
    // Try Edamam first if keys are available
    if (EDAMAM_APP_ID && EDAMAM_APP_KEY) {
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?ingr=${encodeURIComponent(query)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.hints && data.hints.length > 0) {
          return data.hints.slice(0, 10).map((hint: any) => ({
            id: hint.food.foodId,
            name: hint.food.label,
          }))
        }
      }
    }

    try {
      const response = await fetch(
        `${OPEN_FOOD_FACTS_API}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.products && data.products.length > 0) {
          return data.products
            .filter((product: any) => product.product_name && product.product_name.length > 0)
            .slice(0, 10)
            .map((product: any) => ({
              id: product.code || product._id || Math.random().toString(),
              name: product.product_name || "Unknown",
            }))
        }
      }
    } catch (error) {
      console.error("Error with Open Food Facts API:", error)
    }
  } catch (error) {
    console.error("Error searching food items:", error)
  }

  return []
}

export const fetchNutritionData = async (foodId: string, foodName: string): Promise<NutritionData | null> => {
  try {
    // Try Edamam first if keys are available
    if (EDAMAM_APP_ID && EDAMAM_APP_KEY) {
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/nutrients?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredients: [
              {
                quantity: 100,
                measureURI: "http://www.edamam.com/ontologies/edamam.owl#Measure_gram",
                foodId: foodId,
              },
            ],
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const nutrients = data.totalNutrients || {}
        
        return {
          name: foodName,
          kcal: Math.round(nutrients.ENERC_KCAL?.quantity || 0),
          protein: Math.round((nutrients.PROCNT?.quantity || 0) * 10) / 10,
          carbs: Math.round((nutrients.CHOCDF?.quantity || 0) * 10) / 10,
          fats: Math.round((nutrients.FAT?.quantity || 0) * 10) / 10,
          fiber: nutrients.FIBTG?.quantity ? Math.round((nutrients.FIBTG.quantity || 0) * 10) / 10 : undefined,
          micronutrients: {
            vitaminA: nutrients.VITA_RAE?.quantity ? Math.round(nutrients.VITA_RAE.quantity * 10) / 10 : undefined,
            vitaminC: nutrients.VITC?.quantity ? Math.round((nutrients.VITC.quantity || 0) * 10) / 10 : undefined,
            vitaminD: nutrients.VITD?.quantity ? Math.round((nutrients.VITD.quantity || 0) * 10) / 10 : undefined,
            vitaminE: nutrients.TOCPHA?.quantity ? Math.round((nutrients.TOCPHA.quantity || 0) * 10) / 10 : undefined,
            vitaminK: nutrients.VITK1?.quantity ? Math.round((nutrients.VITK1.quantity || 0) * 10) / 10 : undefined,
            thiamin: nutrients.THIA?.quantity ? Math.round((nutrients.THIA.quantity || 0) * 10) / 10 : undefined,
            riboflavin: nutrients.RIBF?.quantity ? Math.round((nutrients.RIBF.quantity || 0) * 10) / 10 : undefined,
            niacin: nutrients.NIA?.quantity ? Math.round((nutrients.NIA.quantity || 0) * 10) / 10 : undefined,
            vitaminB6: nutrients.VITB6A?.quantity ? Math.round((nutrients.VITB6A.quantity || 0) * 10) / 10 : undefined,
            folate: nutrients.FOLDFE?.quantity ? Math.round((nutrients.FOLDFE.quantity || 0) * 10) / 10 : undefined,
            vitaminB12: nutrients.VITB12?.quantity ? Math.round((nutrients.VITB12.quantity || 0) * 10) / 10 : undefined,
            biotin: nutrients.BIOT?.quantity ? Math.round((nutrients.BIOT.quantity || 0) * 10) / 10 : undefined,
            pantothenicAcid: nutrients.PANTAC?.quantity ? Math.round((nutrients.PANTAC.quantity || 0) * 10) / 10 : undefined,
            choline: nutrients.CHOLN?.quantity ? Math.round((nutrients.CHOLN.quantity || 0) * 10) / 10 : undefined,
            calcium: nutrients.CA?.quantity ? Math.round((nutrients.CA.quantity || 0) * 10) / 10 : undefined,
            iron: nutrients.FE?.quantity ? Math.round((nutrients.FE.quantity || 0) * 10) / 10 : undefined,
            magnesium: nutrients.MG?.quantity ? Math.round((nutrients.MG.quantity || 0) * 10) / 10 : undefined,
            phosphorus: nutrients.P?.quantity ? Math.round((nutrients.P.quantity || 0) * 10) / 10 : undefined,
            potassium: nutrients.K?.quantity ? Math.round((nutrients.K.quantity || 0) * 10) / 10 : undefined,
            sodium: nutrients.NA?.quantity ? Math.round((nutrients.NA.quantity || 0) * 10) / 10 : undefined,
            zinc: nutrients.ZN?.quantity ? Math.round((nutrients.ZN.quantity || 0) * 10) / 10 : undefined,
            copper: nutrients.CU?.quantity ? Math.round((nutrients.CU.quantity || 0) * 10) / 10 : undefined,
            manganese: nutrients.MN?.quantity ? Math.round((nutrients.MN.quantity || 0) * 10) / 10 : undefined,
            selenium: nutrients.SE?.quantity ? Math.round((nutrients.SE.quantity || 0) * 10) / 10 : undefined,
            chromium: nutrients.CR?.quantity ? Math.round((nutrients.CR.quantity || 0) * 10) / 10 : undefined,
            molybdenum: nutrients.MO?.quantity ? Math.round((nutrients.MO.quantity || 0) * 10) / 10 : undefined,
            iodine: nutrients.I?.quantity ? Math.round((nutrients.I.quantity || 0) * 10) / 10 : undefined,
          },
        }
      }
    }

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${foodId}.json`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 1 && data.product) {
          const product = data.product
          const nutriments = product.nutriments || {}
          
          return {
            name: foodName,
            kcal: Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0),
            protein: Math.round((nutriments["proteins_100g"] || nutriments.proteins || 0) * 10) / 10,
            carbs: Math.round((nutriments["carbohydrates_100g"] || nutriments.carbohydrates || 0) * 10) / 10,
            fats: Math.round((nutriments["fat_100g"] || nutriments.fat || 0) * 10) / 10,
            fiber: nutriments["fiber_100g"] || nutriments.fiber ? Math.round((nutriments["fiber_100g"] || nutriments.fiber || 0) * 10) / 10 : undefined,
            micronutrients: {
              vitaminA: nutriments["vitamin-a_100g"] ? Math.round((nutriments["vitamin-a_100g"] || 0) * 10) / 10 : undefined,
              vitaminC: nutriments["vitamin-c_100g"] ? Math.round((nutriments["vitamin-c_100g"] || 0) * 10) / 10 : undefined,
              vitaminD: nutriments["vitamin-d_100g"] ? Math.round((nutriments["vitamin-d_100g"] || 0) * 10) / 10 : undefined,
              vitaminE: nutriments["vitamin-e_100g"] ? Math.round((nutriments["vitamin-e_100g"] || 0) * 10) / 10 : undefined,
              vitaminK: nutriments["vitamin-k_100g"] ? Math.round((nutriments["vitamin-k_100g"] || 0) * 10) / 10 : undefined,
              calcium: nutriments["calcium_100g"] ? Math.round((nutriments["calcium_100g"] || 0) * 10) / 10 : undefined,
              iron: nutriments["iron_100g"] ? Math.round((nutriments["iron_100g"] || 0) * 10) / 10 : undefined,
              magnesium: nutriments["magnesium_100g"] ? Math.round((nutriments["magnesium_100g"] || 0) * 10) / 10 : undefined,
              phosphorus: nutriments["phosphorus_100g"] ? Math.round((nutriments["phosphorus_100g"] || 0) * 10) / 10 : undefined,
              potassium: nutriments["potassium_100g"] ? Math.round((nutriments["potassium_100g"] || 0) * 10) / 10 : undefined,
              sodium: nutriments["sodium_100g"] ? Math.round((nutriments["sodium_100g"] || 0) * 10) / 10 : undefined,
              zinc: nutriments["zinc_100g"] ? Math.round((nutriments["zinc_100g"] || 0) * 10) / 10 : undefined,
            },
          }
        }
      }
    } catch (error) {
      console.error("Error with Open Food Facts API:", error)
    }
  } catch (error) {
    console.error("Error fetching nutrition data:", error)
  }

  return null
}

export const parseDishDescription = async (description: string): Promise<NutritionData | null> => {
  if (!description || description.length < 3) return null

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ""
  
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a nutrition expert. Parse the dish description and return ONLY a JSON object with nutrition data for approximately 100g serving. 
              Return format: {
                "name": "dish name",
                "kcal": number,
                "protein": number (grams),
                "carbs": number (grams),
                "fats": number (grams),
                "fiber": number (grams, optional),
                "micronutrients": {
                  "vitaminA": number (mcg, optional),
                  "vitaminC": number (mg, optional),
                  "vitaminD": number (mcg, optional),
                  "calcium": number (mg, optional),
                  "iron": number (mg, optional),
                  "magnesium": number (mg, optional),
                  "potassium": number (mg, optional),
                  "sodium": number (mg, optional),
                  "zinc": number (mg, optional)
                }
              }
              Only include fields that have meaningful values. Return ONLY the JSON, no other text.`,
            },
            {
              role: "user",
              content: `Parse this dish description and provide nutrition data: "${description}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const nutritionData = JSON.parse(jsonMatch[0])
            
            return {
              name: nutritionData.name || description,
              kcal: Math.round(nutritionData.kcal || 0),
              protein: Math.round((nutritionData.protein || 0) * 10) / 10,
              carbs: Math.round((nutritionData.carbs || 0) * 10) / 10,
              fats: Math.round((nutritionData.fats || 0) * 10) / 10,
              fiber: nutritionData.fiber ? Math.round((nutritionData.fiber || 0) * 10) / 10 : undefined,
              micronutrients: nutritionData.micronutrients || undefined,
            }
          }
        }
      }
    } catch (error) {
      console.error("Error with OpenAI API:", error)
    }
  }

  try {
    const words = description.toLowerCase().split(/[\s,]+/)
    const commonFoods = [
      "chicken", "beef", "pork", "fish", "salmon", "tuna", "egg", "eggs",
      "rice", "pasta", "bread", "potato", "potatoes", "tomato", "tomatoes",
      "onion", "onions", "garlic", "cheese", "milk", "yogurt",
      "apple", "banana", "orange", "strawberry", "blueberry",
      "broccoli", "spinach", "carrot", "carrots", "lettuce",
      "oil", "butter", "sugar", "salt", "pepper"
    ]

    const foundIngredients: string[] = []
    for (const word of words) {
      if (commonFoods.some(food => word.includes(food) || food.includes(word))) {
        foundIngredients.push(word)
      }
    }

    if (foundIngredients.length > 0) {
      const ingredientQueries = foundIngredients.slice(0, 3)
      let totalKcal = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFats = 0
      let count = 0

      for (const ingredient of ingredientQueries) {
        const results = await searchFoodItems(ingredient)
        if (results.length > 0) {
          const nutrition = await fetchNutritionData(results[0].id, results[0].name)
          if (nutrition) {
            const portionMultiplier = 0.3
            totalKcal += nutrition.kcal * portionMultiplier
            totalProtein += nutrition.protein * portionMultiplier
            totalCarbs += nutrition.carbs * portionMultiplier
            totalFats += nutrition.fats * portionMultiplier
            count++
          }
        }
      }

      if (count > 0) {
        return {
          name: description,
          kcal: Math.round(totalKcal),
          protein: Math.round((totalProtein / count) * 10) / 10,
          carbs: Math.round((totalCarbs / count) * 10) / 10,
          fats: Math.round((totalFats / count) * 10) / 10,
        }
      }
    }
  } catch (error) {
    console.error("Error parsing dish description:", error)
  }

  return null
}

