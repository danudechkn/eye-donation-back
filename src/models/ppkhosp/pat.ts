import { Model, DataTypes } from "sequelize";
import { sequelize } from "./index";

class Pat extends Model {
  declare hn: string;
  declare citizencardno: string | null;
  declare prename: string | null;
  declare firstname: string | null;
  declare lastname: string | null;
  declare sex: number | null;
  declare birthdatetime: Date | null;

  static associate(models: any) {
  }
}

Pat.init(
  {
    hn: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    citizencardno: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    prename: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sex: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    birthdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pat",
    timestamps: false, // ฐานข้อมูล HIS ส่วนใหญ่มักไม่มี createdAt/updatedAt แบบมาตรฐาน Sequelize
  }
);

export default Pat;
