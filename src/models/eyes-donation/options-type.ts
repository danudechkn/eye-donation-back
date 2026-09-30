import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class OptionType extends Model<
    InferAttributes<OptionType>,
    InferCreationAttributes<OptionType>
> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare column_name: string;
    declare flag_active: CreationOptional<string>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static associate(models: any) {
        // OptionType.hasMany(models.Option, { foreignKey: 'options_type_id', as: 'options' });
    }
}

OptionType.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        column_name: {
            type: DataTypes.STRING(100),
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
        tableName: "options_type",
        timestamps: true,
    }
);

export default OptionType;