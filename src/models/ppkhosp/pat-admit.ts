import { Model, DataTypes } from "sequelize";
import { sequelize } from "./index";

class PatAdmit extends Model {
  declare an: string;
  declare dischargedate: Date | null;
  declare dischargedatetime: Date | null;
  declare dischlocationid: number | null;
  declare tolocationid: number | null;

  static associate(models: any) {
  }
}

PatAdmit.init(
  {
    an: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    dischargedate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dischargedatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dischlocationid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tolocationid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pat_admit",
    timestamps: false,
  }
);

export default PatAdmit;
