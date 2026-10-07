import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./index";

class DonorCase extends Model<
  InferAttributes<DonorCase>,
  InferCreationAttributes<DonorCase>
> {
  declare id: CreationOptional<number>;
  // declare hospital_code: CreationOptional<string>;
  // declare hospital_name: CreationOptional<string>;
  // declare pkpt: CreationOptional<string>;
  // declare cid: CreationOptional<string | null>;
  declare braincardiac: CreationOptional<number>;
  declare hn: CreationOptional<string>;
  // declare an: CreationOptional<string | null>;
  declare potential: CreationOptional<number>;
  declare chkpotential: CreationOptional<number>;
  declare commentnonchk: CreationOptional<string | null>;
  declare wardtotc: CreationOptional<number>;
  declare negotiate: CreationOptional<number>;
  declare negotiate_succ: CreationOptional<number | null>;
  declare commentnonnego: CreationOptional<string | null>;
  declare geteye: CreationOptional<number>;
  declare eyetotal: CreationOptional<number>;
  declare commentnoget: CreationOptional<string | null>;
  declare negotiate_staff: CreationOptional<string | null>;
  declare geteye_staff: CreationOptional<string | null>;
  declare firststaff: CreationOptional<string>;
  declare fristtime: CreationOptional<Date | null>;
  declare status: CreationOptional<number>;
  declare is_complete: CreationOptional<number>;
  // declare region_id: CreationOptional<number | null>;
  // declare region_name: CreationOptional<string | null>;
  // declare chwpart: CreationOptional<number | null>;
  // declare chwpart_name: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: any) { }
}

DonorCase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    // hospital_code: {
    //   type: DataTypes.STRING(13),
    //   allowNull: false,
    //   defaultValue: "null",
    // },
    // hospital_name: {
    //   type: DataTypes.STRING(200),
    //   allowNull: false,
    //   defaultValue: "null",
    // },
    // pkpt: {
    //   type: DataTypes.STRING(30),
    //   allowNull: false,
    //   defaultValue: "-",
    // },
    // cid: {
    //   type: DataTypes.STRING(13),
    //   allowNull: true,
    //   defaultValue: null,
    // },
    braincardiac: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hn: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    // an: {
    //   type: DataTypes.STRING(10),
    //   allowNull: true,
    //   defaultValue: null,
    // },
    potential: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chkpotential: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    commentnonchk: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    wardtotc: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    negotiate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    negotiate_succ: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    commentnonnego: {
      type: DataTypes.STRING(250),
      allowNull: true,
      defaultValue: null,
    },
    geteye: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eyetotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    commentnoget: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    negotiate_staff: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    geteye_staff: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    firststaff: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "-",
    },
    fristtime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    is_complete: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    // region_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   defaultValue: null,
    // },
    // region_name: {
    //   type: DataTypes.STRING(200),
    //   allowNull: true,
    //   defaultValue: null,
    // },
    // chwpart: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   defaultValue: null,
    // },
    // chwpart_name: {
    //   type: DataTypes.STRING(200),
    //   allowNull: true,
    //   defaultValue: null,
    // },
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
    tableName: "donor_cases",
    timestamps: true,
  }
);

export default DonorCase;
