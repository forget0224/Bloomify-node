import express from 'express'
const router = express.Router()
import { Op } from 'sequelize'

// 檢查空物件, 轉換req.params為數字
import { getIdParam } from '#db-helpers/db-tool.js'

// 資料庫使用
import sequelize from '#configs/db.js'

const {
  Product,
  Product_Image,
  Product_Tag,
  Share_Tag,
  Product_Category,
  Share_Store,
  Share_Color,
  Product_Review,
  Share_Star,
  Member,
} = sequelize.models

// 建立一對多關聯：圖片資料表定義
Product.hasMany(Product_Image, { foreignKey: 'product_id', as: 'images' })
Product_Image.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })

// 建立多對多關聯：產品與共享標籤
Product.belongsToMany(Share_Tag, {
  through: Product_Tag,
  foreignKey: 'product_id',
  as: 'tags',
})
Share_Tag.belongsToMany(Product, {
  through: Product_Tag,
  foreignKey: 'share_tag_id',
})

// 在 Product 模型中建立多對一關聯
Product.belongsTo(Share_Store, { foreignKey: 'share_store_id', as: 'stores' })
// 在 Share_Store 模型中建立一對多關聯
Share_Store.hasMany(Product, { foreignKey: 'share_store_id', as: 'products' })

// 建立一對多關聯：產品類別表定義
Product_Category.hasMany(Product, {
  foreignKey: 'product_category_id',
  as: 'products',
})
Product.belongsTo(Product_Category, {
  foreignKey: 'product_category_id',
  as: 'category',
})

// 建立一對多關聯：顏色表定義
Share_Color.hasMany(Product, { foreignKey: 'share_color_id', as: 'product' })
Product.belongsTo(Share_Color, { foreignKey: 'share_color_id', as: 'colors' })

// 建立一對多關聯：一個商品，多個評論；一個評論，一個商品
Product.hasMany(Product_Review, {
  foreignKey: 'product_id',
  as: 'reviews',
})
Product_Review.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
})

// 建立商品評論與共享星等關聯
// models/Product_Review.js
Product_Review.belongsTo(Share_Star, {
  foreignKey: 'share_star_id',
  as: 'star',
})

// models/Share_Star.js
Share_Star.hasMany(Product_Review, {
  foreignKey: 'share_star_id',
  as: 'reviews',
})

// 建立商品評論與會員關聯
Product_Review.belongsTo(Member, {
  foreignKey: 'member_id',
  as: 'member',
})

Member.hasMany(Product_Review, {
  foreignKey: 'member_id',
  as: 'reviews',
})

// GET - 得到所有商品
router.get('/', async function (req, res) {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Product_Image,
          as: 'images',
          attributes: ['id', 'url', 'is_thumbnail'],
        },
        {
          model: Share_Tag,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Product_Category,
          as: 'category',
          attributes: ['id', 'name', 'parent_id'], // 指定需要的屬性
        },
        {
          model: Share_Store,
          as: 'stores',
          attributes: ['store_id', 'store_name', 'store_info'],
        },
        {
          model: Share_Color,
          as: 'colors',
          attributes: ['name', 'code'],
        },
        {
          model: Product_Review,
          as: 'reviews',
          attributes: [
            'id',
            'member_id',
            'share_star_id',
            'comment',
            'created_at',
            'updated_at',
          ],
          include: [
            {
              model: Share_Star,
              as: 'star',
              attributes: ['id', 'name', 'numbers'],
            },
            {
              model: Member,
              as: 'member',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      // raw: true,
      nest: true,
      limit: 189,
    })
    return res.json({ status: 'success', data: { products } })
  } catch (error) {
    console.error('Error fetching Products:', error)
    return res
      .status(500)
      .json({ status: 'error', message: 'Internal server error' })
  }
})

// 篩選子項目
// Importing required models and other necessary libraries may be assumed here.

// Define a GET route handler for the '/filter' endpoint.
router.get('/filter', async function (req, res) {
  // Extract parent_id from the query parameters of the request.
  const { parent_id, keyword, sort } = req.query

  // Initialize an object to hold conditions for the database query.
  const whereConditions = {}

  // If a parent_id is provided, include products that belong to categories with the specified parent_id.
  if (parent_id) {
    whereConditions['$category.parent_id$'] = parent_id // Use sequelize's nested eager loading syntax.
  }

  // Implement keyword search and sorting as required, omitted for brevity.

  try {
    // Perform a database query to find all products matching the whereConditions.
    const products = await Product.findAll({
      include: [
        // Include related models and specify the attributes to retrieve.
        // ... Your existing include definitions.
      ],
      where: whereConditions,
      // Implement your order options logic here, omitted for brevity.
      // ...
      nest: true,
      limit: 189, // Adjust as necessary.
    })

    // If the query is successful, return the products in the response.
    return res.json({ status: 'success', data: { products } })
  } catch (error) {
    // If there's an error during the database query, log the error and return a server error response.
    console.error('Error fetching Products:', error)
    return res
      .status(500)
      .json({ status: 'error', message: 'Internal server error' })
  }
})

// GET - 得到單筆資料(注意，有動態參數時要寫在GET區段最後面)
router.get('/:id', async function (req, res) {
  const id = getIdParam(req)
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Product_Image,
          as: 'images', // Ensure that this alias matches the one defined in the association
          attributes: ['id', 'url', 'is_thumbnail'], // Select only necessary fields
        },
        {
          model: Product_Category,
          as: 'category',
          attributes: ['name'], // 指定需要的屬性
        },
        {
          model: Share_Store,
          as: 'stores',
          attributes: ['store_id', 'store_name', 'store_info'],
        },
        {
          model: Share_Tag,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Product_Review,
          as: 'reviews',
          attributes: [
            'id',
            'member_id',
            'share_star_id',
            'comment',
            'created_at',
            'updated_at',
          ],
          include: [
            {
              model: Share_Star,
              as: 'star',
              attributes: ['id', 'name', 'numbers'],
            },
            {
              model: Member,
              as: 'member',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      nest: true, // This option enables a nested return structure that's easier to work with
    })

    if (product) {
      return res.json({ status: 'success', data: { product } })
    } else {
      return res
        .status(404)
        .json({ status: 'error', message: 'Product not found' })
    }
  } catch (error) {
    console.error('Error fetching Product:', error)
    return res
      .status(500)
      .json({ status: 'error', message: 'Internal server error' })
  }
})
export default router
