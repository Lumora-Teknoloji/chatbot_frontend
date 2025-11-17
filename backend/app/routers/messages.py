from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("/", response_model=schemas.MessageOut, status_code=status.HTTP_201_CREATED)
def create_message(
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    conversation = db.get(models.Conversation, payload.conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı")

    message = models.Message(
        conversation_id=payload.conversation_id,
        sender=payload.sender,
        content=payload.content,
        image_url=payload.image_url,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

