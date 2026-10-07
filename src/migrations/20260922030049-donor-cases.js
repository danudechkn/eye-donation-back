'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('donor_cases', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      // hospital_code: {
      //   type: Sequelize.STRING(13),
      //   allowNull: false,
      //   defaultValue: 'null',
      // },
      // hospital_name: {
      //   type: Sequelize.STRING(200),
      //   allowNull: false,
      //   defaultValue: 'null',
      // },
      // pkpt: {
      //   type: Sequelize.STRING(30),
      //   allowNull: false,
      //   defaultValue: '-',
      // },
      braincardiac: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      hn: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      // an: {
      //   type: Sequelize.STRING(10),
      //   allowNull: true,
      //   defaultValue: null,
      // },
      potential: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      chkpotential: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      commentnonchk: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      wardtotc: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      negotiate: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      negotiate_succ: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      commentnonnego: {
        type: Sequelize.STRING(250),
        allowNull: true,
        defaultValue: null,
      },
      geteye: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      eyetotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      commentnoget: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: null,
      },
      negotiate_staff: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: null,
      },
      geteye_staff: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: null,
      },
      firststaff: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: '-',
      },
      fristtime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // region_id: {
      //   type: Sequelize.INTEGER,
      //   allowNull: true,
      //   defaultValue: null,
      // },
      // region_name: {
      //   type: Sequelize.STRING(200),
      //   allowNull: true,s
      //   defaultValue: null,
      // },
      // chwpart: {
      //   type: Sequelize.INTEGER,
      //   allowNull: true,
      //   defaultValue: null,
      // },
      // chwpart_name: {
      //   type: Sequelize.STRING(200),
      //   allowNull: true,
      //   defaultValue: null,
      // },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('donor_cases');
  }
};
