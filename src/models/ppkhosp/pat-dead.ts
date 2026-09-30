import { Model, DataTypes } from "sequelize";
import { sequelize } from "./index";

class PatDead extends Model {
  declare hn: string;
  declare an: string | null;
  declare diagdetail: string | null;
  declare icdcode: string | null;
  declare editdatetime: Date | null;

  static associate(models: any) {
  }
}

PatDead.init(
  {
    hn: {
      type: DataTypes.STRING(20),
      primaryKey: true, 
      allowNull: false,
    },
    an: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    diagdetail: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    icdcode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    editdatetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "pat_dead",
    timestamps: false,
  }
);

export default PatDead;
