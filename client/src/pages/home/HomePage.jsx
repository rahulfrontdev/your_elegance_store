import Promotional from '../../components/Promotional'
import CategoryCards from '../../components/categories/CategoryCards'
import NewArrivalProduct from '../../components/NewArrivalProduct/NewArrivalProduct'
import BestDeal from '../../components/BestDeal/BestDeal'
import ReelsSection from '../../components/InstagramEmbadded/Insta'


const HomePage = () => {
  return (
    <section>
      <Promotional />
      <CategoryCards />
      <NewArrivalProduct />
      <BestDeal />
      <ReelsSection />
    </section>
  )
}

export default HomePage
