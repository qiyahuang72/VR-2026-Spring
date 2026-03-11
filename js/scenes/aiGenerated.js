export const init = async model => { 
    const box = model.add('cube').identity().move(-0.6, 0.135, -2).scale(0.15, 0.3, 0.15).color(0, 1, 0);
    const cylinder = model.add('tubeY').identity().move(-0.2, 0.24, -2).scale(0.2, 0.4, 0.2).color(1, 0, 0);
    const blueBox = model.add('cube').identity().move(0.2, 0.375, -2).scale(0.15, 0.15, 0.15).color(0, 0, 1);
    const ball = model.add('sphere').identity().move(0.6, 0.45, -2).scale(0.3, 0.3, 0.3).color(1, 0, 0);
};