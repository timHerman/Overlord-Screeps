/**
 * Created by rober on 6/21/2017.
 */


module.exports.terminalControl = function () {
    for (let terminal of _.values(Game.structures)) {
        if (terminal.structureType === STRUCTURE_TERMINAL) {
            if (Game.market.credits < 1000) {
                fillBuyOrders(terminal);
            }
        }
    }
};

function fillBuyOrders(terminal) {
    if (RESOURCE_ENERGY in terminal.store >= 500) {
        for (const resourceType in terminal.store) {
            if (resourceType.amount > 1000 && resourceType !== RESOURCE_ENERGY) {
                let buyOrders = Game.market.getAllOrders(order => order.resourceType === resourceType &&
                order.type === ORDER_BUY && order.remainingAmount >= 1000 &&
                Game.market.calcTransactionCost(1000, terminal.pos.roomName, order.roomName) < 500);
                if (buyOrders.length > 0) {
                    for (let i = 0; i < buyOrders.length; i++) {
                        if (Game.market.deal(buyOrders.id, 1000, terminal.pos.roomName) === OK) {
                            console.log('buyOrderFilled -' + buyOrders.id);
                        }
                    }
                }
            }
        }
    } else {
        console.log('Terminal needs energy');
    }
}