import { Model, DataTypes } from "sequelize";
import { sequelize } from "./index";

class Location extends Model {
  declare id: number;
  declare detailtext: string | null;

  static associate(models: any) {
  }
}

Location.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    detailtext: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "location",
    timestamps: false,
  }
);

export default Location;
