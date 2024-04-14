import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Intro_Season',
    {
      season_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      season: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'intro_season', //直接提供資料表名稱
      timestamps: true, // 使用時間戳
      paranoid: false, // 軟性刪除
      underscored: true, // 所有自動建立欄位，使用snake_case命名
      createdAt: 'created_at', // 建立的時間戳
      updatedAt: 'updated_at', // 更新的時間戳 霹靂卡霹靂拉拉波波力那貝貝魯多
    }
  )
}