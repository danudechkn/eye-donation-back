import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

export type AppRole = "eye" | "organ" | "both" | "admin";
export type UserStatus = "pending" | "active" | "suspended";

class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare provider_id: string;
  declare name: CreationOptional<string>;
  declare position: CreationOptional<string | null>;
  declare hospcode: CreationOptional<string | null>;
  declare app_role: CreationOptional<AppRole>;
  declare status: CreationOptional<UserStatus>;
  declare is_active: CreationOptional<boolean>;
  declare last_login_at: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(_models: any) {}
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    provider_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "เจ้าหน้าที่",
    },
    position: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: null,
    },
    hospcode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    app_role: {
      type: DataTypes.ENUM("eye", "organ", "both", "admin"),
      allowNull: false,
      defaultValue: "eye",
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "suspended"),
      allowNull: false,
      defaultValue: "pending",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  },
);

export default User;
