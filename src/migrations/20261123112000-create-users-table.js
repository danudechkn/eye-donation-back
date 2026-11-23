'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables.map((t) =>
      typeof t === 'string' ? t.toLowerCase() : String(Object.values(t)[0]).toLowerCase(),
    );

    if (!normalizedTables.includes('users')) {
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        provider_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING(200),
          allowNull: false,
          defaultValue: 'เจ้าหน้าที่',
        },
        position: {
          type: Sequelize.STRING(150),
          allowNull: true,
          defaultValue: null,
        },
        hospcode: {
          type: Sequelize.STRING(20),
          allowNull: true,
          defaultValue: null,
        },
        app_role: {
          type: Sequelize.ENUM('eye', 'organ', 'admin'),
          allowNull: false,
          defaultValue: 'eye',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        last_login_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          ),
        },
      });
    } else {
      const tableDesc = await queryInterface.describeTable('users');
      if (tableDesc.cid) {
        await queryInterface.sequelize.query(
          "UPDATE `users` SET `provider_id` = `cid` WHERE (`provider_id` IS NULL OR `provider_id` = '') AND `cid` IS NOT NULL",
        );
        await queryInterface.removeColumn('users', 'cid');
      }
      await queryInterface.changeColumn('users', 'provider_id', {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
