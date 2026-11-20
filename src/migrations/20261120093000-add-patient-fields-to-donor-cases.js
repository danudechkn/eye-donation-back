'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');

      if (!tableInfo.fullname) {
        await queryInterface.addColumn('donor_cases', 'fullname', {
          type: Sequelize.STRING(200),
          allowNull: true,
          defaultValue: null,
        });
      }

      if (!tableInfo.cid) {
        await queryInterface.addColumn('donor_cases', 'cid', {
          type: Sequelize.STRING(20),
          allowNull: true,
          defaultValue: null,
        });
      }

      if (!tableInfo.deathtext) {
        await queryInterface.addColumn('donor_cases', 'deathtext', {
          type: Sequelize.STRING(500),
          allowNull: true,
          defaultValue: null,
        });
      }

      if (!tableInfo.icd10) {
        await queryInterface.addColumn('donor_cases', 'icd10', {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
        });
      }
    } catch (e) {
      console.error('Migration add-patient-fields-to-donor-cases up error:', e);
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');

      if (tableInfo.icd10) {
        await queryInterface.removeColumn('donor_cases', 'icd10');
      }
      if (tableInfo.deathtext) {
        await queryInterface.removeColumn('donor_cases', 'deathtext');
      }
      if (tableInfo.cid) {
        await queryInterface.removeColumn('donor_cases', 'cid');
      }
      if (tableInfo.fullname) {
        await queryInterface.removeColumn('donor_cases', 'fullname');
      }
    } catch (e) {
      console.error('Migration add-patient-fields-to-donor-cases down error:', e);
      throw e;
    }
  },
};
