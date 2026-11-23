'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'app_role', {
      type: Sequelize.ENUM('eye', 'organ', 'both', 'admin'),
      allowNull: false,
      defaultValue: 'eye',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE users SET app_role = 'eye' WHERE app_role = 'both'",
    );
    await queryInterface.changeColumn('users', 'app_role', {
      type: Sequelize.ENUM('eye', 'organ', 'admin'),
      allowNull: false,
      defaultValue: 'eye',
    });
  },
};
