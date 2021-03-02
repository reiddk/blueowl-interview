import React from 'react';
import { cardSettings } from '../cardContainer/cardContainer';
import './card.css';



interface CardProp {
    settings: cardSettings,
    deleteCard: any
}
export default class Card extends React.Component<CardProp> {

    constructor(props: CardProp) {
        super(props);
    }

    render() {
        const classesToAddObj = ['card'];
        let styles = {};
        if (this.props.settings.adding === true) {
            classesToAddObj.push('adding');
        } else if (this.props.settings.adding === false) {
            classesToAddObj.push('added');
        }
        if (this.props.settings.deleting === true) {
            classesToAddObj.push('deleting');
        }
        if (this.props.settings.cardMoving === true) {
            classesToAddObj.push('moving');
            styles = {top:this.props.settings.cardY, left: this.props.settings.cardX};
        }
        if (this.props.settings.hidden === true) {
            classesToAddObj.push('hideCard');
        }
        let addingCard = classesToAddObj.join(" ");
        return (
            <div ref={this.props.settings.reference} className={`${addingCard} `} style={styles}>
                <div className="cardInterior">
                    <div><span onClick={this.props.deleteCard} className="deleteCard">x</span></div>
                    <div className="cardNumberText">{this.props.settings.cardNum}</div>
                </div>
            </div>
        );
    }
}