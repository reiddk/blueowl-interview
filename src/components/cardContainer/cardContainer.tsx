import React from 'react';
import { isReturnStatement } from 'typescript';
import Card from "../card/card";
import "./cardContainer.css";

//re-usable wait function to help organize animations
async function wait(milliseconds: number):Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds)
    });
}
//I'd normally use UUID npm library, but I'm 
//trying to do this without any libraries other than react
function generateUniqueNum() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

interface Props {

}

interface State {
    cardsArr: cardSettings[],
    containerHeight: number | null
}

export interface cardSettings {
    uniqueVal:string,
    cardNum: number,
    cardMoving: boolean,
    cardX: number | null,
    cardY: number | null,
    destinationX:number | null,
    destinationY:number | null,
    adding: boolean | null,
    deleting: boolean | null,
    hidden: boolean | null,
    postAnimationIndex: number,
    reference: any
}

export default class CardContainer extends React.Component<Props, State> {

    state = {
        cardsArr: [],
        containerHeight: null
    };

    divElement;

    constructor(props: Props) {
        super(props);
        
        this.setupDelete = this.setupDelete.bind(this);
        this.addCard = this.addCard.bind(this);
        this.sortCards = this.sortCards.bind(this);
    }

    async deleteCard(indexToRemove: number) {
        const newCardsArr = this.state.cardsArr.filter((card, index) => index !== indexToRemove) as cardSettings[];
        await this.moveCards();
        this.setState({
            cardsArr: newCardsArr
        });
    }

    sortArrayByCardNum(theArray: cardSettings[]) {
        theArray.sort((a,b) => {
            return a.cardNum - b.cardNum;
        });
    }

    setElementsXY(theArray: cardSettings[]) {
        for (const setting of theArray) {
            if (!setting?.reference?.current) {
                continue;
            }
            const parentXY = this.divElement.getBoundingClientRect();
            const locationXY = setting.reference.current.getBoundingClientRect();
            setting.cardX = locationXY.left - parentXY.left;
            setting.cardY = locationXY.top - parentXY.top;
        }
    }

    getXYIndexFromUniqueVal(uniqueKey, theArray: cardSettings[]) {
        for (let i = 0; i < theArray.length; i++) {
            const setting = theArray[i];
            if (setting.uniqueVal === uniqueKey) {
                return i;
            }
        }
        return -1;
    }

    async sortCards() {
        await this.moveCards(true);
        const sortedArray = [...this.state.cardsArr];
        this.sortArrayByCardNum(sortedArray);
        this.setState({
            cardsArr:sortedArray
        });
    }


    async moveCards(sorting:boolean = false) {
        if (window.innerWidth < 660 && !sorting) {
            return;
        }
        const currentScrollLocation = this.divElement.scrollTop;
        const preAnimationArray = [...this.state.cardsArr];
        const postAnimationArray = preAnimationArray.filter(setting => {
            return !setting.deleting;
        });
        if (sorting) {
            this.sortArrayByCardNum(postAnimationArray);
        }
        //setting current locations and locations where they will be added
        this.setElementsXY(preAnimationArray);
        this.setElementsXY(postAnimationArray);
        
        //Setting locations where it will be moving using the
        //locations of the post Animation Array
        for (const preAnimation of preAnimationArray) {
            const destinationIndex = this.getXYIndexFromUniqueVal(preAnimation.uniqueVal, postAnimationArray);
            
            if (destinationIndex < 0 || destinationIndex >= preAnimationArray.length) {
                preAnimation.hidden = true;
                continue;
            }
            preAnimation.destinationX = preAnimationArray[destinationIndex].cardX;
            preAnimation.destinationY = preAnimationArray[destinationIndex].cardY;
            preAnimation.cardMoving = true;
        }
        
        let mainContainerHeight = this.divElement.clientHeight;
        if (mainContainerHeight > 800) {
            mainContainerHeight = 800;
        }
        this.setState({
            cardsArr: preAnimationArray,
            containerHeight: mainContainerHeight
        });
        const loopSize = 80;
        const startXByUniqueVal = {};
        const startYByUniqueVal = {};
        for(let i = 0; i < loopSize; i++) {

            await wait(1);
            for (const preAnimation of preAnimationArray) {
                
                const xToAdd = startXByUniqueVal[preAnimation.uniqueVal] || Math.abs(preAnimation.destinationX - preAnimation.cardX)/loopSize;
                startXByUniqueVal[preAnimation.uniqueVal] = xToAdd;
                
                const yToAdd = startYByUniqueVal[preAnimation.uniqueVal] || Math.abs(preAnimation.destinationY - preAnimation.cardY)/loopSize;
                startYByUniqueVal[preAnimation.uniqueVal] = yToAdd;
                
                    if (preAnimation.destinationX < preAnimation.cardX) {
                        preAnimation.cardX -= xToAdd;
                    } else {
                        preAnimation.cardX += xToAdd;
                    }
                    if (preAnimation.destinationY < preAnimation.cardY) {
                        preAnimation.cardY -= yToAdd;
                    } else {
                        preAnimation.cardY += yToAdd;
                    }
            }
            this.setState({
                cardsArr: preAnimationArray
            });
        }

        for (const preAnimation of preAnimationArray) {
            preAnimation.cardMoving = false;
            preAnimation.hidden = false;
        }
        this.setState({
            cardsArr: preAnimationArray,
            containerHeight: null
        });

        this.divElement.scrollTop = currentScrollLocation;
    }

    async setupDelete(indexToRemove: number) {
        this.cardDeleting(indexToRemove);
        await wait(350);
        this.deleteCard(indexToRemove);
    }

    cardDeleting(index: number) {
        const currArr = [...this.state.cardsArr];

        for (let i = 0; i < currArr.length; i++) {
            if (i === index) {
                currArr[i].deleting = true;
            }
        }
        this.setState({
            cardsArr: currArr
        });
    }

    cardNoLongerAdding(index: number) {
        const currArr = [...this.state.cardsArr];

        for (let i = 0; i < currArr.length; i++) {
            if (i === index) {
                currArr[i].adding = false;
            }
        }
        this.setState({
            cardsArr: currArr
        });
    }

    cardAdding(index: number) {
        const currArr = [...this.state.cardsArr];

        for (let i = 0; i < currArr.length; i++) {
            if (i === index) {
                currArr[i].adding = true;
            }
        }
        this.setState({
            cardsArr: currArr
        });
    }

    async addCard() {
        const currArr = [...this.state.cardsArr];
        const newCardIndex = currArr.length;
        currArr.push({
            uniqueVal:generateUniqueNum(),
            cardNum: Math.floor(Math.random() * 101),
            cardMoving: false,
            cardX: null,
            cardY: null,
            destinationX:null,
            destinationY:null,
            adding: null,
            hidden:null,
            deleting: false,
            reference: React.createRef()
        });
        this.setState({
            cardsArr: currArr
        });
        await wait(1);
        this.cardAdding(newCardIndex);
        await wait(350);
        this.cardNoLongerAdding(newCardIndex);
    }

    render() {
        const cardsElements = this.state.cardsArr.map((cardSettings, index) => {
            return <Card key={cardSettings.uniqueVal} settings={cardSettings} deleteCard={() => this.setupDelete(index)}></Card>
        });
        const styles = {};
        if (this.state.containerHeight) {
            styles['height'] = this.state.containerHeight + 'px';
        }
        return (
            <div style={styles} ref={(divElement) => { this.divElement = divElement }} className="cardsContainer">
                <div className="cardControl">
                    <div className="buttonContainer"><button onClick={this.addCard}>add card</button></div>
                    <div className="buttonContainer"><button onClick={this.sortCards}>sort cards</button></div>
                </div>
            <div className="cards">
                {cardsElements}
            </div>
            </div>
        );
    }
}