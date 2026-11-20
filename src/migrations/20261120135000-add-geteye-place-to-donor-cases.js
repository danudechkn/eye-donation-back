'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');
      if (!tableInfo.geteye_place) {
        await queryInterface.addColumn('donor_cases', 'geteye_place', {
          type: Sequelize.STRING(250),
          allowNull: true,
          defaultValue: null,
        });
      }
    } catch (e) {
      console.error('Migration add-geteye-place-to-donor-cases up error:', e);
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('donor_cases');
      if (tableInfo.geteye_place) {
        await queryInterface.removeColumn('donor_cases', 'geteye_place');
      }
    } catch (e) {
      console.error('Migration add-geteye-place-to-donor-cases down error:', e);
      throw e;
    }
  },
};
