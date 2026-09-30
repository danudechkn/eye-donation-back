import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class Option extends Model<
    InferAttributes<Option>,
    InferCreationAttributes<Option>
> {
    declare id: CreationOptional<number>;
    declare options_type_id: number;
    declare value: number;
    declare meaning: string;
    declare flag_active: CreationOptional<string>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: any) {
    }
}

Option.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        options_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        value: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        meaning: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        flag_active: {
            type: DataTypes.STRING(1),
            allowNull: false,
            defaultValue: "Y",
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
        tableName: "options",
        timestamps: true,
    }
);

export default Option;