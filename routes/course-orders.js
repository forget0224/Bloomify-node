import express from 'express'
const router = express.Router()

// 檢查空物件, 轉換 req.params 為數字
import { getIdParam } from '#db-helpers/db-tool.js'

// 資料庫使用
import sequelize from '#configs/db.js'

const {
  Course_Order,
  Course_Order_Item,
  Course,
  Share_Payment,
  Share_Order_Status,
  Share_Payment_Status,
  Share_Invoice,
  Course_Image,
  Course_Datetime,
  Share_Store,
} = sequelize.models

// 課程訂單和課程訂單項目的關聯
Course_Order.hasMany(Course_Order_Item, {
  foreignKey: 'order_id',
  as: 'items',
})
Course_Order_Item.belongsTo(Course_Order, {
  foreignKey: 'order_id',
  as: 'order',
})

// 課程訂單項目和課程的關聯
Course.hasMany(Course_Order_Item, {
  foreignKey: 'course_id',
  as: 'orderItems',
})
Course_Order_Item.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
})

// 課程訂單與付款方式、付款狀態、訂單狀態的關聯
Course_Order.belongsTo(Share_Payment, {
  as: 'payment',
  foreignKey: 'share_payment_id',
})
Course_Order.belongsTo(Share_Payment_Status, {
  as: 'payment_status',
  foreignKey: 'share_payment_status_id',
})
Course_Order.belongsTo(Share_Order_Status, {
  as: 'order_status',
  foreignKey: 'share_order_status_id',
})

// 路由建構 ---------------------------------

// GET - 得到所有訂單
router.get('/', async function (req, res) {
  try {
    // const memberId = req.query.memberId // 从请求中获取memberId
    const memberId = 1 // 从请求中获取memberId
    // if (!memberId) {
    //   return res
    //     .status(400)
    //     .json({ status: 'error', message: 'Member ID is required' })
    // }
    const orders = await Course_Order.findAll({
      where: { member_id: memberId },
      include: [
        {
          model: Course_Order_Item, // 引入課程項目資料表
          as: 'items',
          attributes: ['id', 'order_id', 'course_id', 'period'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['name', 'price'],
              include: [
                {
                  model: Course_Image,
                  as: 'images',
                  attributes: ['path'],
                  where: {
                    is_main: 1, // 这将确保只包括主图片
                  },
                  required: false,
                },
                {
                  model: Course_Datetime,
                  as: 'datetimes',
                  where: {
                    period: sequelize.col('items.period'), // 这里尝试引用外层的 period 字段
                  },
                  required: false,
                  attributes: [
                    'id',
                    'period',
                    'date',
                    'start_time',
                    'end_time',
                  ],
                },
                {
                  model: Share_Store,
                  as: 'store',
                  attributes: ['store_id', 'store_name', 'store_address'],
                },
              ],
            },
          ],
        },
        { model: Share_Payment, as: 'payment', attributes: ['name'] },
        {
          model: Share_Payment_Status,
          as: 'payment_status',
          attributes: ['name'],
        },
        {
          model: Share_Order_Status,
          as: 'order_status',
          attributes: ['name'],
        },
      ],
      nest: true,
    })

    // 過濾datetimes
    const filteredOrders = orders.map((order) => ({
      ...order.get({ plain: true }), // 转换为简单对象
      items: order.items.map((item) => ({
        ...item.get({ plain: true }),
        course: {
          ...item.course.get({ plain: true }),
          datetimes: item.course.datetimes.filter(
            (datetime) => datetime.period === item.period
          ),
        },
      })),
    }))

    // 返回處理後的數據
    res.json({
      status: 'success',
      data: filteredOrders,
    })
  } catch (error) {
    console.error('Error retrieving orders:', error)
    res.status(500).json({ status: 'error', message: 'Internal server error' })
  }
})

export default router
